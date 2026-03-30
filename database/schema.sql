-- ─────────────────────────────────────────────────────────────────────────────
-- TrustNet — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- Extends auth.users with TrustNet-specific profile data
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name               TEXT        NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  country                 TEXT        DEFAULT 'Tanzania',
  city                    TEXT,
  profession              TEXT,
  account_type            TEXT        DEFAULT 'professional',  -- 'professional' | 'job_seeker' | 'business'
  role                    TEXT        DEFAULT 'individual',    -- 'individual' | 'business' | 'admin'
  verification_method     TEXT,
  id_number               TEXT,
  id_verification_status  TEXT        DEFAULT 'pending',       -- 'pending' | 'verified' | 'rejected'
  document_url            TEXT,
  did                     TEXT,
  bio                     TEXT,
  member_since            TEXT,
  trust_score             INTEGER     DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
-- GIN index for full-text search on profiles.full_name.
-- Required by the textSearch() call in app/api/users/route.ts.
-- Run once against your Supabase project:
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_fts
  ON public.profiles USING gin(to_tsvector('english', full_name));

-- ─── Companies ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id            UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name       TEXT        NOT NULL,
  industry            TEXT,
  country             TEXT,
  city                TEXT,
  address             TEXT,
  website             TEXT,
  description         TEXT,
  tin_number          TEXT,
  registration_number TEXT,
  contact_name        TEXT,
  contact_phone       TEXT,
  contact_email       TEXT,
  verification_status TEXT        DEFAULT 'pending',
  checks_remaining    INTEGER     DEFAULT 10,
  checks_used         INTEGER     DEFAULT 0,
  subscription_plan   TEXT        DEFAULT 'starter',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Credentials ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credentials (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type              TEXT        NOT NULL,  -- 'identity' | 'employment' | 'payment' | 'endorsement' | 'skill'
  title             TEXT,
  description       TEXT,
  issuer_name       TEXT,
  issuer_type       TEXT,                  -- 'commercial_bank' | 'mobile_money' | 'employer' | 'peer' | etc.
  provenance_weight FLOAT       DEFAULT 0.80,
  status            TEXT        DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  confidence        FLOAT       DEFAULT 0.90,
  document_url      TEXT,
  issued_at         TIMESTAMPTZ DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,                   -- NULL means no expiry
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trust Checks ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trust_checks (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id            UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requester_company_id  UUID        REFERENCES public.companies(id) ON DELETE SET NULL,
  consent_status        TEXT        DEFAULT 'pending',  -- 'pending' | 'granted' | 'denied'
  score_at_check        INTEGER,
  risk_tier             TEXT,                           -- 'low' | 'medium' | 'high'
  credentials_shared    JSONB       DEFAULT '[]',
  note                  TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Endorsements ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.endorsements (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  endorser_id  UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id   UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating       INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  relationship TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (endorser_id, subject_id)
);

-- ─── Disputes ─────────────────────────────────────────────────────────────────
-- Filed by credential subjects against credentials they believe are incorrect.
CREATE TABLE IF NOT EXISTS public.disputes (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id   UUID        REFERENCES public.credentials(id) ON DELETE CASCADE NOT NULL,
  filed_by        UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason          TEXT        NOT NULL,
  evidence_url    TEXT,                             -- optional supporting document (storage path)
  status          TEXT        DEFAULT 'open',       -- 'open' | 'resolved' | 'dismissed'
  resolution_note TEXT,
  resolved_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_select_involved" ON public.disputes FOR SELECT
  USING (auth.uid() = filed_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "disputes_insert_own" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = filed_by);
CREATE POLICY "disputes_update_admin" ON public.disputes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Scoring Config ───────────────────────────────────────────────────────────
-- Single-row table. Always UPDATE, never INSERT after initial seed.
CREATE TABLE IF NOT EXISTS public.scoring_config (
  id               INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  factor_weights   JSONB       NOT NULL DEFAULT '{"identity":0.15,"financial":0.25,"work_history":0.25,"endorsement":0.15,"skill":0.05}',
  risk_thresholds  JSONB       NOT NULL DEFAULT '{"low":700,"medium":450}',
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed default row
INSERT INTO public.scoring_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.scoring_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scoring_config_select_all" ON public.scoring_config FOR SELECT USING (true);
CREATE POLICY "scoring_config_update_admin" ON public.scoring_config FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Storage Bucket ───────────────────────────────────────────────────────────
-- Create via Supabase Dashboard → Storage → New Bucket
-- Name: "documents" | Public: false
-- Or run:
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_all"   ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Companies
CREATE POLICY "companies_select_all"  ON public.companies FOR SELECT USING (true);
CREATE POLICY "companies_insert_own"  ON public.companies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_update_own"  ON public.companies FOR UPDATE USING (auth.uid() = owner_id);

-- Credentials
CREATE POLICY "creds_select_own"      ON public.credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "creds_insert_own"      ON public.credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "creds_update_own"      ON public.credentials FOR UPDATE USING (auth.uid() = user_id);

-- Trust checks
CREATE POLICY "tc_select_involved"    ON public.trust_checks FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = subject_id);
CREATE POLICY "tc_insert_requester"   ON public.trust_checks FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "tc_update_subject"     ON public.trust_checks FOR UPDATE USING (auth.uid() = subject_id);

-- Endorsements
CREATE POLICY "endorse_select_all"    ON public.endorsements FOR SELECT USING (true);
CREATE POLICY "endorse_insert_own"    ON public.endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id);
CREATE POLICY "endorse_update_own"    ON public.endorsements FOR UPDATE USING (auth.uid() = endorser_id);

-- Storage: authenticated users can upload to documents/
CREATE POLICY "storage_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "storage_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ─── Trigger: auto-create profile skeleton on signup ─────────────────────────
-- (Optional — the app inserts the profile explicitly, but this is a safety net)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'individual')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

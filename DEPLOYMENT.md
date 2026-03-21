# TrustNet — Deployment Guide

## Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account (or Render)
- GitHub repo: `https://github.com/foggopluz/Trusted`

---

## 1. Set Up Supabase

### Create tables (run in Supabase SQL Editor)

```sql
-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text unique,
  phone text,
  country text default 'Tanzania',
  profession text,
  bio text,
  verification_status text default 'unverified'
    check (verification_status in ('unverified','pending','verified')),
  id_document_url text,
  trust_score integer default 300,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Public profiles readable" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Credentials
create table credentials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  issuer_id uuid references profiles(id),
  issuer_name text,
  issuer_email text,
  type text check (type in ('employment','payment','endorsement','identity','skill')),
  description text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  proof_url text,
  created_at timestamptz default now()
);
alter table credentials enable row level security;
create policy "Users view own credentials" on credentials for select using (auth.uid() = user_id or auth.uid() = issuer_id);
create policy "Users insert credentials" on credentials for insert with check (auth.uid() = user_id);
create policy "Issuers update status" on credentials for update using (auth.uid() = issuer_id);

-- Endorsements
create table endorsements (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references profiles(id) on delete cascade,
  to_user_id uuid references profiles(id) on delete cascade,
  from_name text,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id)
);
alter table endorsements enable row level security;
create policy "Anyone can read endorsements" on endorsements for select using (true);
create policy "Logged-in users can endorse" on endorsements for insert with check (auth.uid() = from_user_id);
create policy "Users update own endorsements" on endorsements for update using (auth.uid() = from_user_id);
```

### Create Storage Buckets
In Supabase → Storage:
1. Create bucket `credential-proofs` (Public)
2. Create bucket `id-documents` (Private)

---

## 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in values:

```bash
cp .env.local.example .env.local
```

Get values from: **Supabase → Project Settings → API**

---

## 3. Deploy to Vercel

### Option A — Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `foggopluz/Trusted` from GitHub
3. Framework: **Next.js** (auto-detected)
4. Add environment variables from `.env.local`
5. Click **Deploy**

### Option B — Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 4. Deploy to Render

1. Go to [render.com/new](https://render.com/new)
2. New **Web Service** → connect `foggopluz/Trusted`
3. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install; npm run build`
   - **Start Command**: `npm start`
4. Add environment variables
5. Click **Deploy**

---

## 5. Local Development

```bash
git clone https://github.com/foggopluz/Trusted.git
cd Trusted
npm install
cp .env.local.example .env.local
# Fill in Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

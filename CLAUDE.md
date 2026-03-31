@AGENTS.md

# TrustNet — Project Instructions for Claude

## What This System Is

TrustNet is a trust-verification platform and B2B integration layer.
Three audiences — treat all three as first-class:

1. **Individuals (subjects)** — build a portable trust profile: credentials,
   W3C Verifiable Credentials, a TrustScore (0–1000), privacy controls
2. **Businesses (verifiers)** — request consent-gated trust checks, issue
   credentials to their employees/customers, bulk-verify applicants
3. **Third-party platforms (integrators)** — embed trust via REST API
   (Bearer tn_live_ keys), webhooks (HMAC-signed), and bulk endpoints

Core principle: **trust is portable**. The score and VCs follow the subject,
not the verifier. Every feature that matters to an individual must also be
accessible programmatically by an integrator.

---

## Domain Model — Critical Names

Never confuse these column/field names:

| Concept | DB column | TS field |
|---|---|---|
| Person being checked | `subject_id` | `subjectUserId` |
| Company owner | `owner_id` | `ownerUserId` |
| Credential type | `type` | `credentialType` |
| VC proof stored value | `proof_hash` | `proofHash` |
| Score snapshot | `score_at_check` | `scoreAtCheck` |

Credential lifecycle: `pending → approved → (proof_hash set, VC issued, email sent, webhooks fired)`

Credential types: `identity | financial | work_history | endorsement | skill`
VC type map lives in `lib/vc.ts → VC_TYPE_MAP`

Trust check lifecycle: `pending → granted | denied`
Only `granted` checks snapshot score/tier/shared credentials.

---

## Architecture Rules

- **API-first**: every feature must work via API key (`tn_live_*`), not only
  session auth. Business-facing routes must always call `validateApiKey(request)`
  before falling through to session auth.
- **Demo mode first**: when `NEXT_PUBLIC_SUPABASE_URL` is unset or is the
  placeholder, all routes must return plausible in-memory data. Never crash.
- **Audit everything sensitive**: `audit()` (fire-and-forget) on trust check
  create/grant/deny, credential approve/reject, API key use, fraud signals,
  bulk verify. Failures must not block the response.
- **Scoring is configurable**: never hardcode factor weights or risk thresholds.
  Always read from `lib/scoring.ts → DEFAULT_FACTOR_WEIGHTS / DEFAULT_RISK_THRESHOLDS`,
  or from the `scoring_config` table in production.
- **Privacy before exposure**: before returning a profile to any viewer,
  apply `applyPrivacyFilter()` from `lib/privacy.ts` with correct `ViewerContext`.

---

## Security Checklist — Apply to Every Route

Every API route must be reviewed against this list before it is considered done:

### Auth
- [ ] Is there a session auth check (`createServerClient()` + `getUser()`) OR API key check (`validateApiKey()`)? Both paths?
- [ ] For admin-only actions: query `profiles.role` from **Supabase** via `createServiceClient()` — never use the in-memory `users` store for role checks in production.
- [ ] For user-scoped data (GET by userId): enforce `userId === session user.id` unless caller is admin or API key.

### Input validation
- [ ] String enum fields (type, status, role, action, country, provider) validated against a known `Set` before DB write.
- [ ] No `...rest` or `...updates` passed directly to Supabase — always use an explicit field allowlist.
- [ ] User-controlled strings interpolated into HTML (emails, responses) wrapped in `escHtml()`.

### Ownership
- [ ] When operating on a resource by ID, verify the resource belongs to the session user (no IDOR).
- [ ] Credential status changes (approve/reject) are admin-only. Never allow the subject to update their own credential status.

### Race conditions
- [ ] Check-then-act sequences (balance checks, duplicate checks) must read and guard BEFORE the write, not after.

### Credential status in scoring
- `computeScore()` accepts both `'active'` AND `'approved'` as active credential statuses (DB stores `'approved'`; the TS type also has `'active'` for legacy reasons). Never filter for only one.

### VC signing
- `VC_PROOF_SECRET` has no default — `issueVC()` throws if absent. Never add a fallback default for this variable.

### RLS
- Credential UPDATE must stay as `USING (false)` — service role only. Do not restore `creds_update_own`.
- All new tables: RLS enabled, explicit policies for every operation (SELECT/INSERT/UPDATE/DELETE).

---

## Key Files

| File | Role |
|---|---|
| `lib/scoring.ts` | Score algorithm — touch carefully, test after changes |
| `lib/vc.ts` | W3C VC issuance + verification (HMAC-SHA256 proof) |
| `lib/fraud.ts` | 6-signal fraud detection (called async on credential POST) |
| `lib/webhooks.ts` | HMAC-signed event dispatch to integrator URLs |
| `lib/gov-id.ts` | Smile Identity abstraction for gov ID checks (TZ/KE/NG/GH/UG/RW) |
| `lib/mobile-money.ts` | M-Pesa Daraja + MTN MoMo account verification |
| `lib/privacy.ts` | Visibility levels (public/verified/private) per profile field |
| `lib/i18n.ts` | Translation dictionaries (en/sw/fr) — use `useLanguage()` hook in UI |
| `lib/audit.ts` | Fire-and-forget audit logger (service role only in production) |
| `lib/api-auth.ts` | `validateApiKey()` — SHA-256 hash lookup in `api_keys` table |
| `hooks/useRealtimeScore.ts` | Supabase Realtime hook for live score updates on dashboard |
| `database/schema.sql` | Source of truth for schema — keep in sync with all migrations |

---

## Integration Endpoints (External Platforms)

These endpoints are designed for machine consumption:

- `GET /api/score?userId=X` — get trust score (API key or session)
- `POST /api/bulk-verify` — batch scores (JSON array or CSV, max 100)
- `POST /api/verify-id` — verify national government ID
- `POST /api/verify-mobile` — verify M-Pesa / MTN MoMo account
- `POST /api/vc/verify` — verify a W3C Verifiable Credential
- `GET/POST/DELETE /api/webhooks` — manage event subscriptions
- `GET/POST/DELETE /api/keys` — manage API keys (max 5/company)

Webhook events: `score.changed | credential.approved | credential.rejected |
trust_check.granted | trust_check.denied`

Webhook payloads are HMAC-SHA256 signed. Integrators must verify:
`X-TrustNet-Signature: sha256=<hex>`

---

## Database Notes

- All new tables need RLS enabled. Pattern: owner can write, involved parties
  can read.
- `audit_logs` is append-only — never UPDATE or DELETE rows. Only service role
  can INSERT (RLS `WITH CHECK (false)` for client inserts).
- `scoring_config` is a single-row table (id=1). Always UPDATE, never INSERT.
- Storage bucket `documents` is private — always use `createSignedUrl()`,
  never `getPublicUrl()`.
- Column `proof_hash` on `credentials` is added as part of VC issuance on
  approval — not present at credential creation time.

---

## Known Technical Debt (do not regress)

- VC proof uses HMAC-SHA256 (not real Ed25519) — documented upgrade path in
  `lib/vc.ts`. Don't add features that depend on W3C spec compliance until
  this is upgraded.
- No webhook retry logic — failed deliveries are logged but not retried.
- No rate limiting on public endpoints (`/api/score`, `/api/verify-id`, etc.).
- VC verification doesn't cross-check credential revocation in the DB.
- Dispute resolution doesn't trigger score recalculation.

---

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | (placeholder = demo mode) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server only) | — |
| `RESEND_API_KEY` | Transactional email | (absent = console log) |
| `EMAIL_FROM` | Sender address | `TrustNet <noreply@trustnet.app>` |
| `NEXT_PUBLIC_APP_URL` | Base URL for email links | `https://trustnet.app` |
| `VC_PROOF_SECRET` | HMAC signing secret for VCs | **REQUIRED — no default, throws if absent** |
| `VC_ISSUER_DID` | DID for VC issuer | `did:trustnet:trustnet-platform` |
| `SMILE_PARTNER_ID` | Gov ID verification | (absent = demo) |
| `SMILE_API_KEY` | Gov ID verification | (absent = demo) |
| `SMILE_ENVIRONMENT` | `sandbox` \| `production` | `sandbox` |
| `MPESA_CONSUMER_KEY` | M-Pesa Daraja | (absent = demo) |
| `MPESA_CONSUMER_SECRET` | M-Pesa Daraja | (absent = demo) |
| `MPESA_ENVIRONMENT` | `sandbox` \| `production` | `sandbox` |
| `MTN_MOMO_SUBSCRIPTION_KEY` | MTN MoMo | (absent = demo) |
| `MTN_MOMO_API_USER_ID` | MTN MoMo | (absent = demo) |
| `MTN_MOMO_API_KEY` | MTN MoMo | (absent = demo) |

---

## Commands

```bash
npm run dev          # start dev server (demo mode without Supabase)
npm run build        # production build
npx tsc --noEmit     # typecheck — run after any series of code changes
npm run lint         # ESLint
```

## Workflow

- Run `npx tsc --noEmit` after every set of changes. Fix errors before committing.
- The app runs in demo mode whenever Supabase env vars are absent — don't treat
  this as broken. It's a feature.
- Commits: single author only (Daniel B. Shayo). No Co-Authored-By lines ever.

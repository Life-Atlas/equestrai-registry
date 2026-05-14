@AGENTS.md

# EquestRai Registry — Autonomous Sprint Execution Prompt

## Project Identity

**EquestRai** is a multi-tenant horse registry platform. **IALHA** (International Andalusian & Lusitano Horse Association) is Tenant 1 — a 501(c)(5) nonprofit with ~15,000 registered P.R.E., P.S.L., and Half-Andalusian horses. They're replacing a 30-year-old paper-based system with 4 disconnected databases.

## Stack

| Layer          | Technology                             | CLI Command                    |
| -------------- | -------------------------------------- | ------------------------------ |
| Frontend       | Next.js 15 (App Router, RSC)           | `pnpm dev`                     |
| Backend/DB     | Supabase PostgreSQL                    | `npx supabase`                 |
| Auth           | Supabase Auth                          | Built-in                       |
| Storage        | Supabase Storage                       | Built-in                       |
| Payments       | Stripe                                 | `stripe listen --forward-to`   |
| Edge Functions | Supabase Edge Functions (Deno)         | `npx supabase functions serve` |
| Notifications  | Resend (email) + Twilio (SMS/WhatsApp) | API from Edge Functions        |
| Deploy         | Vercel                                 | `vercel deploy --prod`         |
| CI/CD          | GitHub Actions                         | `.github/workflows/ci.yml`     |
| AI/LLM         | Claude API via Edge Functions          | `claude`                       |
| Testing        | Vitest (unit) + Playwright (E2E)       | `pnpm test` / `pnpm test:e2e`  |

## 7 Laws (never break these)

1. **CLI-first.** Every operation runs from terminal. No clicking dashboards to create tables.
2. **TDD through and through.** Write test FIRST. Red → Green → Refactor. No exceptions.
3. **AI-native.** Claude Code writes code, runs tests, deploys. Human reviews and approves.
4. **Schema-first.** Every feature starts with DB migration. Schema = source of truth.
5. **CalVer.** Every release: `YYYY.M.D-HHMM` (CET). Tags on main.
6. **Sprint gates are hard gates.** All 12 checks must pass before next sprint.
7. **Multi-tenant from line 1.** Every table has `tenant_id`. Every RLS policy scopes to tenant.

## Architecture Rules

- Schema is ALWAYS `equestrai`, NEVER `public`
- REST API headers: `Accept-Profile: equestrai` (GET), `Content-Profile: equestrai` (POST/PATCH)
- RLS enabled on EVERY table from line 1
- Service role key: backend/Edge Functions only, NEVER in client bundle
- No hardcoded breed/registry strings in shared components — use `src/lib/constants.ts`
- No `DEV_BYPASS_AUTH=true` in production
- All Supabase DDL via `npx supabase db query --linked -f migration.sql`

## Branching

```
main ← staging ← dev ← feature/sprint-{N}-{slug}
```

- NEVER push directly to main or staging
- Feature branches off dev, PRs to dev
- Sprint completion: dev → staging PR (E2E required)
- Release: staging → main PR (full gate)
- CalVer tag on every staging→main merge

## Sprint Gate Checklist (ALL must pass)

1. `pnpm lint` exit 0
2. `pnpm type-check` exit 0
3. `pnpm test` exit 0 (unit)
4. `pnpm test:integration` exit 0
5. `pnpm test:e2e` exit 0
6. `pnpm build` exit 0
7. Deploy to preview URL returns 200
8. Smoke test passes on preview
9. All new migrations applied cleanly
10. New tests written for all new features
11. PR merged to staging
12. Git tag `vYYYY.M.D-HHMM` created

**If ANY gate fails → fix it. Do not proceed.**

## Database Schema

Schema: `equestrai` — 9 core tables in `supabase/migrations/20260514120000_foundation.sql`:

| #   | Table               | Purpose                                    |
| --- | ------------------- | ------------------------------------------ |
| 1   | `tenants`           | Multi-tenant root (IALHA = tenant 1)       |
| 2   | `profiles`          | Member/staff profiles (extends auth.users) |
| 3   | `horses`            | Core entity — every registered horse       |
| 4   | `applications`      | Registration/transfer workflow             |
| 5   | `documents`         | Uploaded files (photos, DNA, certs)        |
| 6   | `ownership_history` | Immutable ownership chain                  |
| 7   | `notifications`     | Notification delivery log                  |
| 8   | `fee_schedules`     | Per-tenant fee configuration               |
| 9   | `audit_log`         | Immutable audit trail                      |

Key relationships:

- `horses.sire_id` / `dam_id` → self-referencing FK (pedigree tree)
- `horses.current_owner_id` → `profiles.id`
- `applications.applicant_id` → `profiles.id`
- All tables have `tenant_id` → `tenants.id`

## IALHA Context (Tenant 1)

**Contact:** Registry@IALHA.org | 205-995-8900
**HQ:** 22 Inverness Center Pkwy #155, Birmingham, AL 35242
**Breeds:** P.R.E. (Andalusian), P.S.L. (Lusitano), Half-Andalusian
**Volume:** ~15,000 registered horses, 20-30 new/month (peak Jun-Dec)
**Languages:** English + Spanish (WhatsApp critical for Spanish-speaking members)
**Current pain:** 40% of clients use pen & paper. Applications sit incomplete for months.

## Fee Schedule (IALHA)

| Type                  | Member | Non-Member |
| --------------------- | ------ | ---------- |
| Purebred registration | $50    | $250       |
| Non-IALHA purebred    | $50    | $250       |
| Half-bred             | $50    | $250       |
| Transfer              | $40    | $120       |
| Agent authorization   | $0     | —          |

---

# Sprint Definitions

## Sprint 1: Foundation (Week 1-2)

**Scope:** Auth + tenant model + horse CRUD + basic UI

### Schema (already done)

- [x] Migration `20260514120000_foundation.sql` — tenants, profiles, horses, fee_schedules, audit_log

### Features to build

1. **Auth flow** — Supabase Auth with email/password + magic link
   - Sign up → auto-create profile in `equestrai.profiles` (trigger or Edge Function)
   - Login page at `/login`, Register at `/register`
   - Middleware redirects unauthenticated users

2. **Tenant resolution** — resolve tenant from profile's `tenant_id`
   - Server component reads profile → gets tenant → passes to layout

3. **Horse CRUD** — list, create, view, edit
   - Dashboard at `/(dashboard)/horses` — table with search + filters
   - Create form at `/(dashboard)/horses/new` — name, sex, breed_type, color, DOB
   - Detail view at `/(dashboard)/horses/[id]` — all fields + pedigree display
   - Owner can edit their own horses (pending status only)

4. **Basic UI shell**
   - Sidebar nav: Dashboard, My Horses, Applications, Documents
   - Responsive layout (375px minimum)
   - Tenant branding (logo, primary color from `tenants` table)

### Tests to write FIRST (Red)

```
tests/unit/lib/constants.test.ts        ← already written
tests/unit/lib/validators.test.ts       ← microchip, pedigree checks
tests/integration/auth.test.ts          ← signup creates profile, RLS blocks cross-tenant
tests/integration/horses.test.ts        ← CRUD, RLS owner/staff/public policies
tests/e2e/smoke.spec.ts                 ← homepage loads
tests/e2e/auth.spec.ts                  ← signup → profile → dashboard
```

### Acceptance criteria

- [ ] User can sign up, log in, see empty dashboard
- [ ] User can add a horse (name, sex, breed, color, DOB)
- [ ] Horse list shows owner's horses
- [ ] RLS blocks cross-tenant access (integration test)
- [ ] Mobile-responsive at 375px
- [ ] Sprint gate passes

---

## Sprint 2: Registration Workflow (Week 3-4)

**Scope:** Application forms + fee calculation + document upload + Stripe checkout

### Schema additions

- Migration for `applications`, `documents`, `ownership_history` tables (in foundation)
- Migration for `breed_rules` table

### Features to build

1. **Application forms** — type-specific wizard
   - Purebred IALHA-bred: horse info + sire/dam selection + 4 marking photos + microchip
   - Transfer: select horse + buyer info + dual signature
   - Half-bred: horse info + sire OR dam must be IALHA-registered

2. **Fee calculation** — from `fee_schedules` table
   - Calculate on form submission based on type + membership
   - Display before payment

3. **Document upload** — Supabase Storage
   - Marking photos (front, rear, left, right)
   - DNA reports, microchip certificates, foreign registration papers
   - File type validation (image/pdf only), size limit (10MB)

4. **Stripe Checkout** — payment flow
   - Create Checkout Session with calculated fee
   - Webhook handler for `checkout.session.completed`
   - Update `payment_status` on application

5. **Missing items tracking**
   - System identifies what's missing on submission
   - `missing_items` array on application
   - Dashboard shows incomplete applications with missing item badges

### Tests to write FIRST

```
tests/unit/lib/form-validation.test.ts  ← purebred, transfer, half-bred rules
tests/unit/lib/pedigree.test.ts         ← sire≠dam, sex validation, duplicate detection
tests/integration/applications.test.ts  ← workflow states, RLS, sire approval
tests/integration/documents.test.ts     ← upload, RLS
tests/integration/stripe.test.ts        ← checkout creation, webhook handling
tests/e2e/register-horse.spec.ts        ← full happy path: form → upload → pay → confirmation
tests/e2e/transfer.spec.ts              ← seller initiates → buyer accepts → ownership updates
```

### Acceptance criteria

- [ ] Member can start purebred registration, fill form, upload photos, pay
- [ ] Fee calculated correctly from fee_schedules table
- [ ] Stripe checkout works (test mode)
- [ ] Missing items identified and displayed
- [ ] Transfer workflow with dual signature
- [ ] Sprint gate passes

---

## Sprint 3: Payments + Notifications + Staff Dashboard (Week 5-6)

**Scope:** Complete payment flow + multi-channel notifications + staff processing

### Schema additions

- `notifications` table (in foundation)
- `notification_templates` table
- `glossary_terms` table (bilingual)

### Features to build

1. **Payment completion** — webhook processing
   - Stripe webhook → update payment_status → trigger notification
   - Check/money order fallback (staff manually marks paid)

2. **Notification system** — multi-channel
   - Email via Resend
   - SMS via Twilio (US numbers)
   - WhatsApp via Twilio/WhatsApp Business API
   - Bilingual templates (EN/ES based on `preferred_lang`)
   - Triggers: submission confirmation, payment received, missing items reminder, status change

3. **Sire approval workflow**
   - Application flagged `requires_sire_approval` when breed is purebred
   - Notification sent to sire owner
   - Magic link for approve/deny without login
   - Approval logged in audit_log

4. **Staff dashboard** — `/(admin)/`
   - Pending applications queue with filters (status, type, date)
   - Application detail view with all documents
   - Approve / reject / request info actions
   - Approval → creates horse record with `registered` status + ownership_history entry

### Tests to write FIRST

```
tests/unit/lib/notification-templates.test.ts ← template rendering, language switching
tests/integration/notifications.test.ts       ← channel selection, delivery logging
tests/integration/sire-approval.test.ts       ← approval flow, magic link, audit
tests/integration/staff-actions.test.ts       ← approve/reject, horse creation
tests/e2e/staff-dashboard.spec.ts             ← staff reviews → approves → member notified
tests/e2e/member-dashboard.spec.ts            ← horse list, status badges, pending actions
```

### Acceptance criteria

- [ ] Payment webhook updates application status
- [ ] Notifications sent via preferred channel in preferred language
- [ ] Sire owner receives approval request and can approve via magic link
- [ ] Staff can review and approve applications
- [ ] Approval creates registered horse + ownership history
- [ ] Sprint gate passes

---

## Sprint 4: AI Layer (Week 7-8)

**Scope:** AI application screening + document extraction + pedigree validation

### Features to build

1. **AI application screening** — Edge Function `ai-screen-application`
   - Claude API validates completeness: sire/dam exist, photos present, microchip format
   - Confidence score (0-1) stored on application
   - Auto-approve if confidence > 0.95 AND all rules pass
   - Flag issues in `ai_flags` array

2. **AI document extraction** — Edge Function `ai-extract-document`
   - Extract text from DNA reports (PDF)
   - Extract markings from photos
   - Validate foreign registration documents

3. **Pedigree validation** — Edge Function
   - Verify sire/dam lineage depth
   - Check for inbreeding coefficient
   - Cross-reference with foreign registries

4. **AI cost controls**
   - Per-tenant daily cost cap
   - Fallback to manual review if AI unavailable
   - Log every AI call: tokens, latency, cost, confidence

### Tests to write FIRST

```
tests/unit/lib/ai-screening.test.ts     ← rule engine, confidence calculation
tests/integration/ai-screening.test.ts  ← Edge Function with mocked Claude response
tests/integration/ai-extraction.test.ts ← document extraction
tests/e2e/ai-workflow.spec.ts           ← submission → AI screen → auto-approve
```

---

## Sprint 5: Member Portal Polish (Week 9-10)

**Scope:** Member dashboard, horse detail, pedigree viewer, search

### Features to build

1. **Member dashboard** — comprehensive view
   - My horses (with status badges)
   - My applications (with progress tracker)
   - Pending actions (missing items, sire approvals)
   - Notification history

2. **Horse detail page** — public studbook
   - Full pedigree tree (3 generations minimum)
   - Photo gallery
   - Ownership history timeline
   - Registration documents

3. **Search** — public studbook search
   - Search by name, registration number, sire, dam
   - Filters: breed type, sex, color, status
   - Edge Function `search-horses` with full-text search

4. **Profile management**
   - Edit profile, farm info, notification preferences
   - Language toggle (EN/ES)
   - Agent authorization management

---

## Sprint 6: Admin + Legacy Import + Launch (Week 11-12)

**Scope:** Admin tools, certificate generation, legacy data import, production hardening

### Features to build

1. **Admin dashboard**
   - Application queue with SLA tracking
   - Member management (roles, membership status)
   - Fee schedule editor
   - Reporting: registrations/month, revenue, processing time

2. **Certificate generation** — Edge Function `generate-certificate`
   - PDF registration certificate
   - Transfer certificate
   - Branded with tenant logo + official numbering

3. **Legacy data import** — Edge Function
   - CSV import pipeline: Oracle dump → validation → Supabase
   - Map old field names to new schema
   - Deduplication on microchip + name + DOB
   - Import report with success/failure counts

4. **Production hardening**
   - Sentry error tracking
   - Rate limiting on all API routes
   - CSP + security headers
   - Bundle size audit (< 500KB gzipped)
   - Performance audit (LCP < 2.5s)

### Acceptance criteria

- [ ] Legacy CSV imported with dedup report
- [ ] Registration certificates generate as PDF
- [ ] Admin can edit fee schedules
- [ ] All 10 production non-negotiables pass
- [ ] Sprint gate passes → tag release → deploy to production

---

# Edge Functions

Located in `supabase/functions/`. Deno runtime.

| Function                 | Sprint | Trigger            | Purpose                     |
| ------------------------ | ------ | ------------------ | --------------------------- |
| `calculate-fees`         | S2     | Application submit | Look up fee from schedule   |
| `ai-screen-application`  | S4     | Application submit | Claude API validation       |
| `send-notification`      | S3     | Status change      | Multi-channel dispatch      |
| `search-horses`          | S5     | User search        | Full-text + pedigree search |
| `create-stripe-checkout` | S2     | Payment initiation | Stripe Checkout Session     |
| `stripe-webhook`         | S2     | Stripe event       | Payment status update       |
| `generate-certificate`   | S6     | Approval           | PDF certificate             |
| `ai-extract-document`    | S4     | Document upload    | Text/data extraction        |
| `pedigree-lookup`        | S5     | Horse detail view  | Ancestry tree query         |

---

# CLI Workflow

```bash
# Start local dev
npx supabase start
pnpm dev

# Create migration
npx supabase migration new description_here
# Edit the file, then:
npx supabase db reset  # apply locally

# Run tests
pnpm test              # unit
pnpm test:integration  # needs local Supabase
pnpm test:e2e          # needs dev server

# Full gate check
pnpm lint && pnpm type-check && pnpm test && pnpm test:integration && pnpm build

# Deploy
vercel deploy --prod

# Tag release
git tag v$(date +%Y.%-m.%-d-%H%M)
git push origin --tags
```

---

# How to Execute a Sprint

When told "Execute Sprint N":

1. **Read** this file → find Sprint N definition
2. **Create branch** `feature/sprint-N-slug` off `dev`
3. **Write schema migration** (if sprint has new tables)
4. **Write tests FIRST** (red) — every test file listed in the sprint
5. **Implement features** (green) — make tests pass one by one
6. **Refactor** if needed — tests still pass
7. **Run sprint gate checklist** — all 12 items
8. **Create PR** to `dev` with sprint summary
9. **Report** what passed, what failed, what's next

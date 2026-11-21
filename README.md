# Mentora AI

An AI-powered career learning platform that helps students discover their ideal tech career, generate personalised learning roadmaps, practise coding, and track progress.

---

## Project Overview

Mentora AI guides Pakistani students from "I don't know what to study" to a verified skill and a real internship. A student takes an 18-question career assessment, gets explainable AI career matches, generates a multi-section learning roadmap with link-checked resources, passes AI milestone tests to unlock each section, practises coding against real test cases in a sandbox, reviews weak topics on a spaced-repetition schedule, earns a QR-verifiable certificate, and browses live Pakistan-only internships.

---

## Features

| Feature | Description |
|---|---|
| **Explainable Career Assessment** | 18 questions → six skill scores (radar chart) computed from the answers; AI-ranked careers cite which answers drove each match. Results are saved and revisitable without re-charging credits |
| **AI Roadmap Generation** | Foundations → Intermediate → Advanced roadmap saved atomically (one DB transaction). Every resource link is checked live; unverifiable links become search links, shown with a Verified / Search badge |
| **Adaptive Milestone Tests** | Fresh 4 MCQ + 1 short-answer set per attempt, graded server-side (answers never reach the browser), short answer graded against a hidden rubric, explanations for wrong answers, cooldown on fail |
| **Spaced-Repetition Review** | Missed topics enter a review queue (1 / 3 / 7 / 14 / 30 days) with a short AI remedial lesson and quick checks |
| **Real Code Execution** | Challenges run in a sandboxed Piston runner against visible and hidden tests in 7 languages. Pass/fail comes only from the tests; AI scores style and writes feedback |
| **AI Tutor Chat** | Streaming, Markdown-rendered, scoped to the current roadmap node; history is loaded server-side |
| **Internships (Pakistan only)** | Scraper collects actively-hiring Pakistan internships from many sources every 6 hours, de-duplicates them and expires stale ones |
| **Certificates** | Issued only when every node is done and every milestone test passed. PDF with QR code, public `/verify` page, LinkedIn "Add to profile" |
| **Leaderboard & Gamification** | Weekly / monthly / all-time XP leaderboard (opt-out), XP ledger, Pakistan-time streaks, badges |
| **Progress & Study Time** | Active study minutes per day and area, 14-day chart, tests, roadmaps and coding stats |
| **AI Evaluation Dashboard** | `/admin/ai`: calls, success / fallback rates, p50 / p95 latency, thumbs-up rate, credits, recent failures, CSV export |
| **Landing, Onboarding & Demo** | Public landing page, 9-step onboarding tour, one-click seeded demo account, password reset |
| **Security** | Row Level Security: users can only read their own rows; every write goes through server code with an ownership check. Credits are refunded when the AI falls back |

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19, TypeScript strict) |
| **Styling** | Tailwind CSS v4 — Intercom-inspired cream/charcoal design system |
| **Database** | Supabase (PostgreSQL + Row Level Security + Auth) |
| **Auth** | Supabase Auth (email/password) with SSR session management |
| **AI Service** | Mentora AI endpoint (`AI_API_URL`) |
| **Code Editor** | CodeMirror 6 (`@uiw/react-codemirror`) with VS Code Dark theme |
| **Animations** | Framer Motion |

---

## Installation Guide

### Prerequisites

- Node.js 20+
- Docker (code runner, local migration checks)
- A [Supabase](https://supabase.com) project
- An AI service URL + secret token (provided separately)

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd my-project
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill it in (see [Environment Variables](#environment-variables)).

### 3. Set up the database

Apply the migrations **in this order** (Supabase → SQL Editor, or `psql`):

1. `supabase/migrations/000_full_setup.sql`
2. `supabase/migrations/001_add_fallback_flags.sql`
3. every file from `004_…` up to the highest number, in numeric order

`001_initial_schema.sql`, `002_…` and `003_…` are already contained in `000_full_setup.sql`; skip them.

With a Postgres connection string it is one command, which also records what was applied:

```bash
FRESH=1 DATABASE_URL="postgresql://…" bash scripts/db/apply.sh   # new database
DATABASE_URL="postgresql://…" bash scripts/db/apply.sh           # existing project: applies 008+ only
```

Then seed the demo account and back-fill link checks for existing resources:

```bash
npx tsx scripts/seed-demo.ts --reset
npx tsx scripts/verify-resources.ts
```

> `SUPABASE_SECRET_KEY` (service role) is required: all writes run server-side with it after an ownership check. Never expose it to the browser.

### 4. Code runner (practice challenges)

Production runs `runner/` (a Piston-compatible service, one sandboxed container per job) on the Oracle VM. Locally you can also use Piston via `docker-compose.runner.yml`. Set `CODE_RUNNER_URL` / `CODE_RUNNER_TOKEN`; see [docs/CODE_RUNNER.md](docs/CODE_RUNNER.md).

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Checks

```bash
npx tsc --noEmit
npm run lint
npm test                        # every *.test.ts self-check
bash scripts/db/validate.sh     # migrations on a fresh Postgres (Docker) + RLS policy checks
```

The same checks run on every push in GitHub Actions (`.github/workflows/ci.yml`).

---

## API Setup Instructions

### Supabase

1. Go to [supabase.com](https://supabase.com) → create a project
2. Navigate to **Project Settings → API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role / secret key** → `SUPABASE_SECRET_KEY`
4. Navigate to **Authentication → URL Configuration** and add `http://localhost:3000` and `http://localhost:3000/auth/callback` to the allowed redirect URLs

### AI Service

The platform talks to a single AI HTTP endpoint defined by `AI_API_URL` and authenticated with a bearer-style `x-secret-token` header (`AI_SECRET_TOKEN`).

```ts
const res = await fetch(`${AI_API_URL}?query=...`, {
  headers: { "x-secret-token": AI_SECRET_TOKEN },
});
const { response } = await res.json();
```

All AI calls (career suggestions, roadmap generation, challenge creation, milestone test generation, code evaluation, and chat) route through this single endpoint via `src/lib/ai/client.ts`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/public key (safe for browser) |
| `SUPABASE_SECRET_KEY` | ✅ | Supabase service role key (server only) |
| `AI_API_URL` | ✅ | Base URL of the AI service |
| `AI_SECRET_TOKEN` | ✅ | Secret sent as the `x-secret-token` header |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public URL of the app; used in certificate QR codes and auth emails |
| `CODE_RUNNER_URL` | ✅ for practice | Piston base URL |
| `CODE_RUNNER_TOKEN` | optional | Token checked by the runner's reverse proxy |
| `ADMIN_EMAILS` | optional | Comma-separated emails allowed into `/admin/ai` |
| `AI_TIMEOUT_MS` | optional | AI request timeout (default 60000) |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | optional | Shared demo account behind "Try the demo" |
| `SEARXNG_URL` | optional | Self-hosted SearXNG for the internship scraper |
| `DATABASE_URL` | scripts only | Postgres URL for `scripts/db/apply.sh` |

---

## Deployment Process

### Deploy to Vercel (recommended)

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo
3. In **Environment Variables**, add the variables from the table above
4. Set **Framework Preset** to `Next.js`
5. Click **Deploy**

After deploying:
- Update `NEXT_PUBLIC_SITE_URL` to your Vercel production URL
- In Supabase → **Authentication → URL Configuration**, add your production URL and `<url>/auth/callback` to the allowed redirect URLs

### Build locally

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
  app/
    (auth)/           # sign-in, sign-up, forgot/reset password, auth callback
    (dashboard)/      # dashboard, assessment, roadmap + tests, review, practice, internships,
                      # progress, leaderboard, certificates, build, admin/ai
    verify/           # public certificate verification + PDF
    api/              # chat streaming, practice evaluation, study-time heartbeat
    actions/          # Server Actions (all DB writes, AI generation)
  components/         # chat, roadmap, practice, progress, certificates, adaptive, landing, onboarding, ui
  lib/
    adaptive/         # spaced repetition, question sets, remedial plans
    ai/               # AI client, streaming, telemetry, evaluation metrics
    assessment/       # skill profile scoring
    resources/        # live link verification
    runner/           # Piston client + grading
    db/ gamification/ credits/ auth/ supabase/
scraper/internships/  # Pakistan internship scraper (runs every 6 h in GitHub Actions)
scripts/              # db apply/validate, demo seed, resource back-fill, test runner
supabase/migrations/  # 000 + 001_add_fallback_flags + 004…016 (see Installation)
docs/                 # code runner setup, next-feature research
AI.md                 # every AI call site, prompt, retry and fallback policy
```

---

## Screenshots

> Screenshots coming soon.

---

## AI Integration

See [AI.md](AI.md) for full documentation of every AI call site, the exact prompt used, and what the output is used for.

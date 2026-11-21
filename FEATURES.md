# Mentora AI: Features

Mentora AI takes a Pakistani student from "I don't know what to study" to a verified skill and a real internship. This file lists everything the platform does today, where to find it in the app, and what comes next.

**New** marks features added in the November 2026 release. Everything else was in the earlier version and has since been hardened.

---

## The student journey

1. **Discover**: take the career assessment, see a skill profile computed from the answers, and get AI-ranked careers that explain why each one fits.
2. **Plan**: turn a career into a three-section roadmap (Foundations, Intermediate, Advanced) with link-checked resources and small tasks.
3. **Learn and prove it**: study each topic, then pass an AI milestone test to unlock the next section. Missed topics come back for spaced review.
4. **Practise**: solve AI-generated coding challenges that run against real test cases in a sandbox.
5. **Build**: get one concrete project idea, laid out as a dependency graph.
6. **Get hired**: earn a QR-verifiable certificate and browse live internships in Pakistan.

---

## 1. Career discovery (`/assessment`)

| Feature | Details |
|---|---|
| Career assessment | Each assessment asks 14 questions, drawn from a bank of 18 stored in the database: experience, maths comfort, what energises and drains you, time, deadline, learning style and motivation. The server validates the answers against the bank. |
| **New** Explainable skill profile | Six skill scores (Building, Analytical, Design, Data, Infrastructure, People) are computed deterministically from the answers, with no AI involved. They're shown as a radar chart, and each strength or weakness quotes the answers that caused it. |
| AI career matches | Careers ranked by fit score, with salary range, demand, "why this fits you", weaker areas and a trade-off for each. |
| **New** Saved results | Every assessment is stored. Results can be reopened at any time without re-running the AI or charging credits again. |

## 2. AI learning roadmaps (`/roadmap/[id]`)

| Feature | Details |
|---|---|
| Roadmap generation | Three sections, each with topics laid out as a tree: a trunk with branches, a "you are here" marker, and completed, available and locked states. |
| Topic tasks | Each topic has resources and short tasks; ticking all tasks completes the topic and awards XP. |
| **New** Atomic save | The whole roadmap (topics, resources, tasks, tests, first unlock) is written in one database transaction, so it is never half-saved. |
| **New** Verified resources | Every resource link is checked live when the roadmap is created. Links that work get a **Verified** badge; ones that don't become an honest search link with a **Search** badge. A back-fill script re-checks older roadmaps. |
| Certificate preview | A banner shows how far the student is from the certificate. |

## 3. Milestone tests (`/roadmap/[id]/test/[testId]`)

| Feature | Details |
|---|---|
| **New** Fresh questions every attempt | 4 multiple-choice questions and 1 short-answer question, generated per attempt from the section's topics. |
| **New** Server-side grading | Correct answers never reach the browser. The short answer is graded by AI against a hidden rubric and can earn partial credit. |
| **New** Explanations | Each wrong answer shows the correct one and why. |
| Section unlock | A score of 70% or more unlocks the next section. **New:** a failed attempt starts a cooldown before the next try, and practice (fallback) tests can never unlock anything. |

## 4. Spaced-repetition review (`/review`): **New**

- Topics missed in a milestone test enter a review queue.
- Each due topic gets a short AI remedial lesson, a practice task and a quick check.
- Passing the check pushes the topic further out (1, 3, 7, 14, then 30 days). Failing it brings the topic back tomorrow.
- The dashboard shows how many topics are due today.

## 5. Coding practice (`/practice`)

| Feature | Details |
|---|---|
| AI challenge generation | The student picks a language, topic and difficulty; the AI writes a real-world problem with examples and starter code. |
| **New** Real code execution | Code runs in a sandbox against visible and hidden test cases in Python, JavaScript, TypeScript, Java, C++, Go and Rust. Pass or fail comes only from the tests. Compile errors, wrong answers, timeouts, crashes and memory limits are each reported clearly. |
| **New** Verified challenges | The AI's reference solution is run against its own tests before the challenge is shown, and any challenge that doesn't pass is marked unverified. |
| AI code review | The AI scores style and writes feedback, but it cannot override the tests. |
| Run vs Submit | **Run** checks the visible examples for free. **Submit** runs the hidden tests too, and XP is awarded only the first time every test passes. |
| History | The table lists each challenge with its language, attempts, best score and status. |

The sandbox runner is self-hosted (`runner/`). Every run uses a fresh container with no network, a read-only file system, a non-root user and memory and process limits.

## 6. What to Build (`/build`)

- A 7-step questionnaire about what the student knows, their interests and how much time they have.
- Produces one specific project idea (no todo apps), laid out as a dependency graph of build steps, with the efficient approach for each step.
- Steps can be ticked off as they are built.

## 7. AI tutor

- A chat drawer, available on every page from the floating button or the sidebar's **AI Tutor** card. Answers stream in.
- **New:** answers render as Markdown with code blocks, and the tutor can be scoped to the roadmap topic being studied.
- **New:** chat history is loaded on the server, not trusted from the browser.
- Students can rate any AI output with a thumbs up or down; those ratings feed the evaluation dashboard.

## 8. Internships in Pakistan (`/internships`): **New**

- A scraper collects internships that are actively hiring in Pakistan (or remote roles open to Pakistan) every 6 hours. Sources:
  - LinkedIn;
  - Pakistani job boards: pintern.net and jobz.pk;
  - company career pages on Greenhouse, Lever, Workday, Breezy, JazzHR and other applicant-tracking systems;
  - web search.
- Every listing is checked to be in Pakistan, posted in the last 45 days, and still open.
  - Duplicates across sources are merged.
  - Listings missing from several runs in a row are expired.
- Filters by city, field, remote, paid and recency, plus search.
- **Recommended for you** (ranked against the careers from the student's assessments and roadmaps) and **Saved** tabs.
- In a spot check of 15 random listings, all 15 were open.

## 9. Certificates (`/certificates`, `/verify`)

| Feature | Details |
|---|---|
| Strict issuing | A certificate is issued only when every topic is complete and every milestone test is passed. |
| Public verification | `/verify/<code>`: anyone can check a certificate code. |
| **New** PDF certificate | A downloadable PDF with the student's name, roadmap, date, code and a QR code that opens the verification page. |
| **New** LinkedIn | An "Add to profile" link pre-fills the certification on LinkedIn. |

## 10. Gamification and community

- **XP** for topics, tests and challenges (easy 10, medium 25, hard 50), with levels.
  - **New:** XP is awarded atomically and recorded in a ledger.
- **Streaks:**
  - **New:** days are counted in Pakistan time (Asia/Karachi), so a streak doesn't break at 5 am.
- **Badges:** First Challenge, On Fire, Century, Dedicated, Expert.
  - **New:** each badge can be awarded only once.
- **New** **Leaderboard** (`/leaderboard`):
  - weekly, monthly and all-time rankings;
  - shows only a first name and last initial;
  - students can opt out.

## 11. Progress and study time (`/progress`)

- **New** **Active study time:** measured by an in-page heartbeat (one minute at most per 50 seconds, so several open tabs can't inflate it). Split by area (roadmaps, practice, review, tests, building) and shown as a 14-day chart with today, week and all-time totals.
- XP earned over 30 days, activity over 30 days (daily or weekly), test average, challenge breakdown by difficulty, and badges.

## 12. Credits (`/pricing`)

Every AI action costs credits. New students get 1,000. Credit packs can be bought in demo mode, where no payment is taken. Every change is logged in a credit history.

| Action | Credits |
|---|---|
| Career suggestions | 50 |
| Generate a roadmap | 200 |
| Generate a milestone test | 60 |
| Generate a coding challenge | 40 |
| Evaluate a code submission | 30 |
| Generate a project blueprint | 150 |
| AI tutor message | 5 |

**New:** credits are spent atomically, so two requests at once can't overspend, and they are refunded automatically when the AI fails and canned content is shown instead.

## 13. Landing page, onboarding and accounts

| Feature | Details |
|---|---|
| **New** Landing page | A public homepage with product previews of career matches, roadmaps and practice. |
| **New** One-click demo | **Try the demo** signs into a seeded demo account (Ayesha Khan) that has roadmaps, tests, challenges and a certificate. |
| **New** Onboarding tour | A 9-step guided tour on the first visit to the dashboard, replayable at any time. |
| **New** Password reset | Forgot-password and reset-password pages, plus an auth callback for email links. |
| **New** Redesigned navigation | A grouped sidebar (Learn, Career, You), an account menu and a mobile drawer. |
| Next action | The dashboard always shows the single most useful next step. |
| Notifications | A bell for certificates, milestones, badges and credits. |

## 14. AI evaluation dashboard (`/admin/ai`): **New**

For admins (`ADMIN_EMAILS`). Covers every AI feature:
- the number of calls and their success and fallback rates;
- p50 and p95 latency;
- the thumbs-up rate;
- credits spent;
- recent failures;
- a CSV export.

`AI.md` documents every AI call site, its prompt, its retry policy and its fallback.

## 15. Security and data integrity: **New**

- **Row Level Security everywhere:** signed-in students can only *read* their own rows.
- **Server-only writes:** every write goes through server code that checks the user and their ownership first. The browser has no write permission on any table.
- **Answers stay server-side:** test answers, hidden tests, reference solutions and grading rubrics live in tables the browser cannot read.
- **Locked-down database functions:** functions that change credits, XP or roadmaps can only be called by the server.
- **Fixed cheat vectors:** the release fixed the seven critical issues from the security audit. Before it, a student could, from the browser console, mint credits, edit their own XP and streak, mark topics done or sections unlocked, forge certificates, or read milestone test answers.
- **Rate limits** on code runs and submissions.

## 16. Engineering quality: **New**

- **CI on every push** (`.github/workflows/ci.yml`):
  - type check, lint and self-check tests;
  - applies every migration to a fresh Postgres and runs 31 row-level-security policy checks.
- **Migration tooling:**
  - one-command migrations (`scripts/db/apply.sh`), which record what has already been applied;
  - a single-file live upgrade (`supabase/live-upgrade.sql`).
- **Scripts:** demo-account seeding (`scripts/seed-demo.ts`) and resource link back-fill (`scripts/verify-resources.ts`).
- **Docs:** setup in the README, the code runner in `docs/CODE_RUNNER.md`, and the AI call sites in `AI.md`.

---

## What comes next

These are ranked by student need, based on research in `docs/NEXT_FEATURES_RESEARCH.md`.

| # | Feature | Why |
|---|---|---|
| 1 | **AI Mock Interview Coach** | Students who reach interviews have rarely practised them. The coach would run role-specific technical and HR mock interviews with scored, actionable feedback. |
| 2 | Verified CV and public portfolio page | Turn certificates, passed challenges and built projects into a shareable profile. |
| 3 | Job-match gap check | On any internship, show which required skills the student already has and which ones to learn next. |
| 4 | Freelancing starter track | A guided route to a student's first paid gig on Fiverr or Upwork. |
| 5 | Urdu / Roman-Urdu explanations | A toggle that re-explains hard concepts in the student's own language. |
| 6 | Company-style screening tests | Timed tests in the format Pakistani companies use for hiring. |

Known limits:
- Urdu and other non-Latin names don't render on the PDF certificate yet.
- The shared demo account can be changed by visitors; reset it with `npx tsx scripts/seed-demo.ts --reset`.

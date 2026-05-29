# Tasks: AI Student Platform

**Input**: `specs/001-ai-student-platform/spec.md` (plan.md not yet generated — tasks derived directly from spec + PRD tech stack)
**Branch**: `001-ai-student-platform`
**Tech Stack**: Next.js (App Router), TypeScript (strict), TailwindCSS, Shadcn UI, Framer Motion, Supabase (PostgreSQL + Auth), OpenAI API
**Note**: Next.js application is already initialised. No scaffolding tasks needed.
**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story for independent implementation and delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelisable — different files, no incomplete dependencies
- **[USn]**: User story this task belongs to

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configure the existing Next.js project with all shared dependencies,
tooling, and environment before any feature work begins.

- [x] T001 Install and configure Supabase client in `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`
- [x] T002 [P] Add environment variable schema validation in `src/lib/env.ts` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OPENAI_API_KEY)
- [x] T003 [P] Install and configure Shadcn UI with TailwindCSS — `src/lib/utils.ts` (cn), dependencies installed
- [x] T004 [P] Install Framer Motion and create base animation variants in `src/lib/animations.ts`
- [x] T005 Install OpenAI SDK and create a shared AI client wrapper in `src/lib/openai/client.ts` with error handling and retry logic
- [x] T006 [P] Create TypeScript type definitions for all key entities in `src/types/index.ts` and `src/types/database.ts`
- [x] T007 [P] Create shared UI layout components: `src/components/layout/AppShell.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/Sidebar.tsx`

**Checkpoint**: Project has Supabase, OpenAI, Shadcn UI, and Framer Motion configured; shared types and layout shell exist.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Authentication, database schema, route protection, and shared
utilities that ALL user stories depend on. No story work begins until complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Create Supabase database schema migrations for all entities: `students`, `careers`, `roadmaps`, `nodes`, `resources`, `milestone_tests`, `milestone_test_attempts`, `chat_messages`, `coding_challenges`, `progress_records`, `badges` — migration file in `supabase/migrations/001_initial_schema.sql`
- [x] T009 Enable Row-Level Security (RLS) policies on all tables in `supabase/migrations/002_rls_policies.sql` — students can only read/write their own data
- [x] T010 Implement Supabase Auth sign-up and sign-in pages in `src/app/(auth)/sign-in/page.tsx` and `src/app/(auth)/sign-up/page.tsx` using Shadcn UI form components
- [x] T011 Create Next.js middleware to protect all non-auth routes — redirect unauthenticated users to `/sign-in` in `src/middleware.ts`
- [x] T012 [P] Create auth helper hooks in `src/hooks/useAuth.ts` for accessing session and user state client-side
- [x] T013 [P] Create shared server-side auth utility in `src/lib/auth/session.ts` to retrieve session in Server Components and API routes
- [x] T014 [P] Create global error boundary component in `src/components/ui/ErrorBoundary.tsx` and a shared API error handler utility in `src/lib/errors.ts`
- [x] T015 [P] Create a shared AI response streaming utility in `src/lib/openai/stream.ts` for use across chatbot and test generation features
- [x] T016 [P] Create a reusable `AILabel` component in `src/components/ui/AILabel.tsx` to satisfy FR-014 (all AI content must be labelled)

**Checkpoint**: Auth works end-to-end; all routes are protected; DB schema is migrated; AI utilities and error handling are in place.

---

## Phase 3: User Story 1 — Career Discovery (Priority: P1) 🎯 MVP

**Goal**: Authenticated student completes a skills assessment and receives ≥ 3
AI-ranked career suggestions with demand, salary, and a "Generate Roadmap" CTA.

**Independent Test**: Log in → complete assessment form → verify ≥ 3 career
cards appear with fit score, demand indicator, salary range, and roadmap CTA.

### Implementation for User Story 1

- [x] T017 [P] [US1] Create `Career` and `AssessmentQuestion` Supabase data-access functions in `src/lib/db/careers.ts`
- [x] T018 [P] [US1] Seed career data and assessment questions via `supabase/seed/careers.sql`
- [x] T019 [US1] Build the assessment form page at `src/app/(dashboard)/assessment/page.tsx` — structured multi-step form using Shadcn UI components; reads questions from DB
- [x] T020 [US1] Create the AI career suggestion Server Action in `src/app/actions/career-suggestions.ts` — submits assessment answers to OpenAI, parses ≥ 3 ranked career results with fit score, demand indicator, and salary range; labels output with `AILabel`
- [x] T021 [US1] Build the career suggestions results page at `src/app/(dashboard)/assessment/results/page.tsx` — displays ranked career cards with Framer Motion entrance animation and "Generate Roadmap" CTA per card
- [x] T022 [US1] Create the "Generate Roadmap" Server Action in `src/app/actions/generate-roadmap.ts` — calls OpenAI to scaffold roadmap nodes from a career template, persists to `roadmaps` and `nodes` tables linked to the student
- [x] T023 [US1] Add error UI for AI service unavailability in the assessment results page — friendly message, no partial data persisted (FR-015)
- [x] T024 [US1] Add empty-state UI if AI returns no career suggestions — prompt student to re-take assessment

**Checkpoint**: US1 fully functional — student can sign in, complete assessment, view career suggestions, and generate a roadmap.

---

## Phase 4: User Story 2 — Learning Path / Roadmap Generator (Priority: P1)

**Goal**: Student opens a roadmap, navigates nodes with resources and tasks,
hits milestone test checkpoints, and unlocks next sections upon scoring ≥ 70%.

**Independent Test**: Open a generated roadmap → expand a node → view resources
and tasks → reach milestone test → submit MCQ answers → verify score display,
explanation, and section unlock/lock behaviour.

### Implementation for User Story 2

- [x] T025 [P] [US2] Create Supabase data-access functions for roadmaps, nodes, resources, and milestone tests in `src/lib/db/roadmaps.ts`
- [x] T026 [P] [US2] Create Supabase data-access functions for milestone test attempts and section unlock logic in `src/lib/db/milestone-tests.ts`
- [x] T027 [US2] Build the student dashboard page at `src/app/(dashboard)/dashboard/page.tsx` — lists enrolled roadmaps with progress percentage; links to each roadmap view
- [x] T028 [US2] Build the interactive roadmap node-graph page at `src/app/(dashboard)/roadmap/[roadmapId]/page.tsx` — renders nodes as a visual graph using Framer Motion; locked sections visually distinct from unlocked
- [x] T029 [US2] Build the node detail panel component at `src/components/roadmap/NodePanel.tsx` — displays resource list (video/article/note links) and task checklist for the selected node
- [x] T030 [US2] Implement node task completion — Server Action in `src/app/actions/complete-node-task.ts` persists task check state per student; updates node completion percentage
- [x] T031 [US2] Build the milestone test page at `src/app/(dashboard)/roadmap/[roadmapId]/test/[testId]/page.tsx` — renders AI-generated questions for MCQ, Q&A, or coding test types with a timer indicator
- [x] T032 [US2] Create the milestone test generation Server Action in `src/app/actions/generate-milestone-test.ts` — calls OpenAI with node topic context, generates questions for the configured test type; labels output with `AILabel`
- [x] T033 [US2] Create the milestone test submission Server Action in `src/app/actions/submit-milestone-test.ts` — scores the attempt, persists to `milestone_test_attempts`, evaluates ≥ 70% threshold, unlocks next section if passed
- [x] T034 [US2] Build the test results component at `src/components/roadmap/TestResults.tsx` — displays score, per-question correct/incorrect explanations, pass/fail status, and retry CTA if failed
- [x] T035 [US2] Add section-lock enforcement in the roadmap page — locked nodes render as disabled; student sees "Complete milestone test to unlock" prompt
- [x] T036 [US2] Add retry flow for failed milestone tests — re-generate test on retry request; previous attempt score preserved in history

**Checkpoint**: US2 fully functional — student can navigate the roadmap, complete tasks and resources, take milestone tests, and have sections gated by 70% pass threshold.

---

## Phase 5: User Story 3 — AI Chatbot (Priority: P2)

**Goal**: Student asks learning questions in the chatbot; receives streamed,
context-aware responses; off-topic requests are declined; full history persists.

**Independent Test**: Open chatbot → send an educational question → verify
streaming response arrives → send an off-topic message → verify decline
message → reload page → verify conversation history is still present.

### Implementation for User Story 3

- [x] T037 [P] [US3] Create Supabase data-access functions for chat messages in `src/lib/db/chat.ts` — load conversation history for a student, append new messages
- [x] T038 [US3] Create the chatbot API route at `src/app/api/chat/route.ts` — accepts student message + optional roadmap node context, enforces educational content policy via system prompt (FR-008b), streams OpenAI response using `src/lib/openai/stream.ts`, persists both user message and assistant response to `chat_messages`
- [x] T039 [US3] Build the chatbot UI panel component at `src/components/chat/ChatPanel.tsx` — message list with scroll-to-bottom, streaming response rendering, loading indicator, and error state for AI unavailability
- [x] T040 [US3] Build the chat input component at `src/components/chat/ChatInput.tsx` — text field, send button, disabled state while streaming
- [x] T041 [US3] Integrate chatbot into the app shell — accessible as a slide-over or persistent sidebar panel from any page using `src/components/layout/ChatDrawer.tsx`
- [x] T042 [US3] Implement roadmap context injection — when chatbot is opened from a node page, pass current node topic as context to the API route; display context indicator in chat UI
- [x] T043 [US3] Add decline message UI — when API returns an educational policy refusal, render a styled notice component `src/components/chat/PolicyRefusalNotice.tsx` instead of a regular message bubble

**Checkpoint**: US3 fully functional — chatbot answers educational questions with streaming, enforces content policy, injects roadmap context, and persists full history.

---

## Phase 6: User Story 4 — AI Programming Practice (Priority: P2)

**Goal**: Student selects language/topic/difficulty, solves an AI-generated
coding challenge in the browser, receives AI evaluation with XP award, and
earns badges/streaks via gamification.

**Independent Test**: Select Python → Arrays → Easy → verify challenge renders
→ submit a solution → verify AI feedback and XP display → verify badge awarded
if threshold met.

### Implementation for User Story 4

- [x] T044 [P] [US4] Create Supabase data-access functions for coding challenges, XP, badges, and streaks in `src/lib/db/practice.ts`
- [x] T045 [US4] Build the practice module landing page at `src/app/(dashboard)/practice/page.tsx` — language selector, topic selector, difficulty selector (Easy / Medium / Hard) using Shadcn UI Select components
- [x] T046 [US4] Create the coding challenge generation Server Action in `src/app/actions/generate-challenge.ts` — calls OpenAI with language, topic, difficulty; returns problem statement and starter scaffold; persists to `coding_challenges`; labels output with `AILabel`
- [x] T047 [US4] Build the coding challenge page at `src/app/(dashboard)/practice/challenge/[challengeId]/page.tsx` — problem statement panel, browser-based code editor (using a lightweight editor component in `src/components/practice/CodeEditor.tsx`), submit button
- [x] T048 [US4] Create the solution evaluation API route at `src/app/api/practice/evaluate/route.ts` — submits student code + problem to OpenAI for correctness and style evaluation; returns pass/fail, feedback, and XP amount; persists evaluation result to `coding_challenges`
- [x] T049 [US4] Build the evaluation results component at `src/components/practice/EvaluationResults.tsx` — pass/fail indicator, AI feedback text, XP earned display; labelled with `AILabel`
- [x] T050 [US4] Implement XP award logic in `src/lib/gamification/xp.ts` — add XP to student record after successful evaluation; define XP values per difficulty tier
- [x] T051 [US4] Implement badge award logic in `src/lib/gamification/badges.ts` — check thresholds after each XP update; award and persist earned badges to `badges` table
- [x] T052 [US4] Implement streak tracking in `src/lib/gamification/streaks.ts` — increment streak counter on daily activity; reset on missed day; persist to student record
- [x] T053 [US4] Build the gamification display component at `src/components/practice/GamificationBar.tsx` — shows current XP, streak count, and newly earned badge notification
- [x] T054 [US4] Add submission queueing for AI judge unavailability — if evaluation API fails, mark submission as `pending_evaluation` in DB and surface a "We'll notify you when ready" message (FR-015)

**Checkpoint**: US4 fully functional — student can generate and solve challenges, receive AI evaluation with XP, earn badges and streaks, with graceful degradation when AI is unavailable.

---

## Phase 7: User Story 5 — Progress Tracking (Priority: P3)

**Goal**: Student views a progress dashboard showing study hours, roadmap
completion, milestone test scores, and coding stats with a time-series chart.

**Independent Test**: With one completed node and one evaluated coding challenge,
open the progress dashboard — verify all stats display correctly and the
analytics chart renders with a daily/weekly toggle.

### Implementation for User Story 5

- [x] T055 [P] [US5] Create Supabase data-access functions for aggregated progress metrics in `src/lib/db/progress.ts` — query study hours, nodes completed, milestone test averages, coding challenge counts
- [x] T056 [US5] Implement study-hour tracking — Server Action in `src/app/actions/record-study-time.ts` records time-on-page heartbeat events from roadmap node pages; aggregates into `progress_records`
- [x] T057 [US5] Build the progress dashboard page at `src/app/(dashboard)/progress/page.tsx` — stat cards for: total study hours, roadmaps completed, nodes completed, tests taken with average score, coding challenges completed
- [x] T058 [US5] Build the growth analytics chart component at `src/components/progress/ActivityChart.tsx` — renders daily/weekly activity using a lightweight charting library; includes daily/weekly toggle
- [x] T059 [US5] Build the empty-state component for the progress dashboard at `src/components/progress/ProgressEmptyState.tsx` — shown when student has no data; includes CTAs to start a roadmap or take a practice challenge
- [x] T060 [US5] Integrate progress dashboard link into the app shell navigation

**Checkpoint**: US5 fully functional — all progress metrics display correctly, chart renders with toggle, empty state guides new students.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, UX consistency, and observability across all stories.

- [x] T061 [P] Add `<AILabel>` component to all remaining AI-generated content surfaces not already labelled (audit: career suggestions, roadmap nodes, milestone test questions, chatbot responses, challenge statements, evaluation feedback)
- [x] T062 [P] Add global loading skeleton components for all data-fetching pages in `src/components/ui/Skeletons.tsx`
- [x] T063 [P] Implement toast notification system using Shadcn UI Toaster in `src/components/ui/Toaster.tsx` — surface success/error feedback across all actions
- [x] T064 Add Framer Motion page transition animations to `src/app/(dashboard)/layout.tsx`
- [x] T065 [P] Audit all Supabase queries for missing indexes — add index migration in `supabase/migrations/003_indexes.sql` for high-frequency query patterns (student_id FK columns, roadmap progress lookups)
- [x] T066 [P] Add rate-limit handling for all OpenAI API calls — surface user-friendly "AI is busy, please try again" message with retry timer
- [ ] T067 Conduct end-to-end walkthrough of the full student journey: sign-up → assessment → roadmap → milestone test → chatbot → practice → progress dashboard
- [x] T068 [P] Update `README.md` with local dev setup instructions, env var documentation, and Supabase migration steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **blocks all user stories**.
- **US1 — Career Discovery (Phase 3)**: Depends on Phase 2; no dependency on other stories.
- **US2 — Roadmap Generator (Phase 4)**: Depends on Phase 2; depends on US1 (roadmaps are generated by US1 flow).
- **US3 — Chatbot (Phase 5)**: Depends on Phase 2; independent of US1/US2.
- **US4 — Practice (Phase 6)**: Depends on Phase 2; independent of US1/US2/US3.
- **US5 — Progress Tracking (Phase 7)**: Depends on Phase 2; benefits from US1+US2+US4 data but can render empty state independently.
- **Polish (Phase 8)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Start after Foundational — no story dependencies.
- **US2 (P1)**: Start after US1 completes (roadmap generation is triggered by US1 flow); test independently once US1 data exists.
- **US3 (P2)**: Start after Foundational — fully independent of US1/US2.
- **US4 (P2)**: Start after Foundational — fully independent.
- **US5 (P3)**: Start after Foundational — can render with empty state; richer with US1+US2+US4 data.

### Within Each User Story

- Data-access functions (`src/lib/db/`) before Server Actions.
- Server Actions before page/component implementation.
- Core page before sub-components.
- Sub-components before integration into layout/shell.

### Parallel Opportunities

- All `[P]`-marked tasks within a phase can run simultaneously.
- US3 (Chatbot) and US4 (Practice) can be developed in parallel after Foundational is complete.
- US5 can begin in parallel with US3/US4 (empty-state renders without data).

---

## Parallel Execution Examples

```text
# Phase 2 — run these together:
T009 RLS policies  ||  T012 useAuth hook  ||  T013 server session util  ||  T014 ErrorBoundary  ||  T015 stream util  ||  T016 AILabel

# Phase 3 — US1 parallel start:
T017 careers DB functions  ||  T018 seed data

# Phase 6 — US4 parallel start:
T044 practice DB functions  ||  T045 practice landing page (shell)

# Phase 5 & 6 — run simultaneously after Phase 4 completes:
All of Phase 5 (Chatbot)  ||  All of Phase 6 (Practice)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL** — blocks everything)
3. Complete Phase 3: US1 — Career Discovery
4. Complete Phase 4: US2 — Roadmap Generator
5. **STOP and VALIDATE**: Student can sign in → complete assessment → view career suggestions → open generated roadmap → work through nodes → take milestone test → pass/fail gating works.
6. Demo/deploy MVP.

### Incremental Delivery

1. Setup + Foundational → Auth and DB ready.
2. US1 → Career discovery live (MVP slice 1).
3. US2 → Full learning loop live (MVP slice 2 — most valuable demo point).
4. US3 → Chatbot live (adds support layer).
5. US4 → Practice module live (adds engagement/gamification).
6. US5 → Progress dashboard live (adds retention layer).
7. Polish → Production-ready.

### Parallel Team Strategy

With two developers after Foundational:
- Developer A: US1 → US2 (core learning loop)
- Developer B: US3 → US4 (engagement features)
- Both converge on US5 + Polish

---

## Notes

- `[P]` = different files, no incomplete dependencies — safe to parallelise.
- `[USn]` label maps every task to its user story for traceability.
- No test tasks generated (not requested in spec).
- Commit after each task or logical group; use task ID in commit message (e.g., `feat(T028): roadmap node-graph page`).
- Stop at each phase **Checkpoint** to validate the story independently before advancing.
- All AI content surfaces MUST use `<AILabel>` — enforced in T061 audit.
- Supabase RLS is a hard requirement — verify policies before any story goes live.

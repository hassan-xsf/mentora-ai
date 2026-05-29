<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 (unset) → 1.0.0
Modified principles: N/A (initial population)
Added sections:
  - Core Principles (I–VI)
  - Tech Stack Constraints
  - Development Workflow
  - Governance
Removed sections: N/A (template placeholders removed)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ Constitution Check section aligned (no edit needed; gates are dynamic)
  - .specify/templates/spec-template.md ✅ No structural conflict found
  - .specify/templates/tasks-template.md ✅ No structural conflict found
Deferred TODOs:
  - RATIFICATION_DATE: set to today (2026-05-25) as first adoption date
-->

# AI Student Platform Constitution

## Core Principles

### I. Student-First Design

Every feature MUST be evaluated against whether it meaningfully helps a student
discover, learn, practice, or track progress. Features that exist solely for
technical elegance without clear student value MUST NOT be shipped.
Personalisation is a first-class requirement, not a nice-to-have.

### II. AI Transparency & Safety

All AI-generated content (career recommendations, roadmaps, test questions,
code judgements) MUST be clearly labelled as AI-generated. The system MUST
never present AI output as authoritative fact. Prompt injection surfaces MUST
be sanitised. OpenAI API calls MUST be wrapped with error handling and
graceful degradation so a failed AI call never breaks a core user flow.

### III. Type-Safe, Component-Driven Frontend

All frontend code MUST be written in TypeScript with strict mode enabled.
UI components MUST be built from the Shadcn UI / TailwindCSS design system;
ad-hoc inline styles are prohibited except for Framer Motion animation
overrides. Shared components MUST live in `src/components/`; page-level
composition lives in `src/app/` (Next.js App Router).

### IV. Supabase as the Single Source of Truth

All persistent state MUST live in Supabase PostgreSQL. Client-side state is
ephemeral and MUST NOT be used as a substitute for persistence. Row-Level
Security (RLS) MUST be enabled on every table. Supabase Auth is the sole
authentication provider; custom auth flows are prohibited.

### V. Test-Before-Ship

Every feature MUST have acceptance scenarios defined in its spec before
implementation begins. Integration tests covering the primary user journey
MUST pass before a feature is considered done. AI evaluation paths (code
judging, MCQ scoring) MUST have deterministic unit tests with mocked AI
responses in addition to integration tests.

### VI. Observability & Incremental Delivery

Each feature MUST be deliverable as an independent, demonstrable increment
(MVP slice). Progress tracking, error logging, and analytics hooks MUST be
added at the time of implementation, not retrofitted. Features MUST ship
behind a working state before cosmetic polish is added.

## Tech Stack Constraints

These constraints are non-negotiable unless amended via the governance process.

| Layer | Mandated Technology |
|-------|-------------------|
| Frontend framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS + Shadcn UI |
| Animation | Framer Motion |
| Backend | Next.js API Routes / Server Actions |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| AI provider | OpenAI API |

**Performance budget**: Page TTI MUST be under 3 s on a mid-range device.
AI response streaming SHOULD be used wherever latency exceeds 1 s.

**Security**: No secrets or API keys MUST be committed to the repository.
All secrets MUST be stored in `.env.local` (gitignored) and documented in
`.env.example` with placeholder values.

## Development Workflow

1. **Spec first**: A `spec.md` MUST exist and be reviewed before any code is written.
2. **Plan second**: A `plan.md` documenting architecture decisions MUST follow.
3. **Tasks third**: `tasks.md` breaks the plan into independently testable tasks.
4. **Red → Green → Refactor**: For each task, write/confirm failing tests, implement to pass, then refactor.
5. **Smallest viable diff**: PRs MUST touch only the files required by the current task.
6. **No hardcoded data**: All seed/mock data lives in fixture files, never inline in components.
7. **Commit hygiene**: Each commit MUST reference the task ID (e.g., `feat(T012): …`).

## Governance

This constitution supersedes all other practices documented in this repository.
Any practice that contradicts a principle above MUST be updated to comply.

**Amendment procedure**:
1. Identify the principle or section to change and describe the motivation.
2. Propose the change in a PR with the updated constitution and bumped version.
3. At least one team member MUST review and approve before merge.
4. Update `LAST_AMENDED_DATE` and `CONSTITUTION_VERSION` in the footer.

**Versioning policy** (semantic):
- MAJOR: removing or redefining a principle in a backward-incompatible way.
- MINOR: adding a new principle or materially expanding guidance.
- PATCH: clarifications, wording fixes, non-semantic refinements.

**Compliance**: Every plan.md MUST include a Constitution Check section
confirming each principle is satisfied or explicitly justified if deviating.

**Version**: 1.0.0 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-05-25

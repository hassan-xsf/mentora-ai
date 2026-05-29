# Feature Specification: AI Student Platform

**Feature Branch**: `001-ai-student-platform`
**Created**: 2026-05-25
**Status**: Draft
**Input**: PRD — AI Student Platform (AI_Student_Platform_PRD.md)

## Product Vision

An AI-powered student platform that helps students discover career paths, learn
efficiently through personalised roadmaps, practice skills, and track growth
over time.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Career Discovery (Priority: P1)

A student opens the platform for the first time and is guided through a
skills-and-interests assessment. The AI analyses the input and returns
personalised career suggestions ranked by fit, showing each career's future
demand, estimated salary range, and a high-level AI-generated roadmap to enter
that field.

**Why this priority**: First-session value — career discovery is the hook that
gives every subsequent feature (roadmaps, practice, progress) a meaningful
direction, and is only accessible to authenticated students.

**Independent Test**: An authenticated student can complete the assessment and
receive at least 3 career suggestions with salary estimates and demand
indicators immediately after logging in.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor reaches the platform, **When** they
   attempt to access the assessment, **Then** they are redirected to the
   sign-in / sign-up page before any assessment content is shown.
2. **Given** an authenticated student has answered the skills assessment,
   **When** they submit, **Then** they see ≥ 3 ranked career suggestions each
   containing title, fit score, future demand indicator, salary range, and a
   "Generate Roadmap" CTA.
3. **Given** a career suggestion is displayed, **When** the student clicks
   "Generate Roadmap", **Then** a personalised learning roadmap is created and
   linked to their account immediately.
4. **Given** the AI service is unavailable, **When** the student submits the
   assessment, **Then** a friendly error message is shown and no partial data
   is persisted.

---

### User Story 2 — Learning Path / Roadmap Generator (Priority: P1)

A student selects a career path and receives an interactive node-graph roadmap
showing ordered learning milestones. Each node contains curated resources
(videos, articles, notes) and tasks. Tests are milestone-based: depending on
the length and complexity of the topic, 1–3 AI-generated milestone tests are
placed at intervals across the roadmap (not after every node). A student must
score ≥ 70% on a milestone test to unlock the next section of the roadmap.

**Why this priority**: The roadmap is the core learning loop — it is what
students return to daily and what drives all engagement and progress metrics.

**Independent Test**: A student can open a roadmap, work through nodes in a
section, reach a milestone test, complete an AI-generated MCQ test, and have
their progress and score recorded — all without interacting with any other
feature.

**Acceptance Scenarios**:

1. **Given** a roadmap is open, **When** the student views a node, **Then**
   they see a resource list and a task list (no per-node test option).
2. **Given** a student reaches a milestone test checkpoint in the roadmap,
   **When** they open it, **Then** they receive an AI-generated test of the
   appropriate type (MCQ / Q&A / coding) with clear instructions.
3. **Given** a student submits a milestone test, **When** results are processed,
   **Then** a score is displayed with correct-answer explanations and their
   score is recorded.
4. **Given** a student scores ≥ 70% on a milestone test, **When** they view
   the roadmap, **Then** the next section of nodes is unlocked.
5. **Given** a student scores < 70% on a milestone test, **When** they view
   the roadmap, **Then** the next section remains locked and they are prompted
   to review the material and retry the test.

---

### User Story 3 — AI Chatbot (Priority: P2)

A student working on a roadmap node encounters a concept they do not understand.
They open the in-platform chatbot, ask a question in natural language, and
receive an explanation tailored to their current roadmap context, with optional
resource and reading recommendations.

**Why this priority**: Accelerates learning without leaving the platform; reduces
drop-off when students hit confusion.

**Independent Test**: A student can open the chatbot, ask a question unrelated
to any specific roadmap, and receive a coherent, helpful response — verifying
the chatbot works standalone.

**Acceptance Scenarios**:

1. **Given** a student types a question, **When** they send it, **Then** a
   response begins streaming back within 5 seconds under normal conditions.
2. **Given** a student asks for resources on a topic, **When** the chatbot
   responds, **Then** it includes at least one actionable resource recommendation.
3. **Given** the conversation has context of the current roadmap node, **When**
   the student asks a concept question, **Then** the response references that
   context rather than giving a generic answer.
4. **Given** a student sends an off-topic, harmful, or non-educational message,
   **When** the chatbot processes it, **Then** it declines to answer and
   responds with a message explaining it only assists with learning and
   educational topics.
5. **Given** the AI service is slow or unavailable, **When** a message is sent,
   **Then** a loading indicator is shown and a graceful error is returned if the
   request times out.

---

### User Story 4 — AI Programming Practice (Priority: P2)

A student wants to sharpen coding skills outside their roadmap. They select a
programming language, a topic (e.g., arrays, recursion), and a difficulty level.
The platform generates a coding challenge; the student writes a solution in the
browser; the AI evaluates correctness and style and awards XP, badges, or streak
credit.

**Why this priority**: Adds a dedicated skill-building loop beyond roadmaps;
drives daily retention through gamification.

**Independent Test**: A student can complete one coding challenge from language
selection to AI evaluation and XP award without touching any roadmap or chatbot
feature.

**Acceptance Scenarios**:

1. **Given** a student selects language, topic, and difficulty, **When** they
   confirm, **Then** a coding challenge with a clear problem statement and
   starter scaffold is displayed.
2. **Given** the student submits their solution, **When** the AI evaluates it,
   **Then** a result is returned showing pass/fail, feedback on correctness and
   style, and XP earned.
3. **Given** a student earns enough XP or completes a streak, **When** the
   threshold is met, **Then** the appropriate badge is awarded and visible on
   their profile.
4. **Given** the AI judge is unavailable, **When** the student submits,
   **Then** the submission is queued and the student is notified when evaluation
   completes with no silent data loss.

---

### User Story 5 — Progress Tracking (Priority: P3)

A student wants to understand how they are growing over time. They open the
progress dashboard and see an overview of study hours logged, roadmaps and nodes
completed, test scores, coding challenge statistics, and a growth analytics
chart.

**Why this priority**: Provides long-term retention motivation; supports
self-directed learning by surfacing patterns (e.g., topics where scores are low).

**Independent Test**: A student with at least one completed roadmap node and one
coding challenge can view a progress dashboard showing meaningful data without
any other feature being present.

**Acceptance Scenarios**:

1. **Given** a student opens the progress dashboard, **When** the page loads,
   **Then** they see total study hours, roadmaps completed, nodes completed,
   tests taken with average score, and coding challenges completed.
2. **Given** a student has data across multiple weeks, **When** they view the
   growth analytics section, **Then** a chart displays activity over time with
   a daily/weekly toggle.
3. **Given** a student has no data yet, **When** they open the dashboard,
   **Then** they see empty-state prompts directing them to start a roadmap or
   take a practice challenge.

---

### Edge Cases

- What happens when the AI returns no career suggestions from the assessment?
- How does the platform behave if a roadmap node has no resources attached?
- What if a student submits an empty or trivially short coding solution?
- How are duplicate or conflicting assessment submissions handled?
- What happens to in-progress roadmap state if a student's account is deleted?
- The chatbot declines all off-topic, harmful, and non-educational requests with a redirect message; no edge case handling needed beyond the content policy enforcement (FR-008b).
- What if a test generation call fails mid-session — can the student retry?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The platform MUST allow students to complete a skills-and-interests
  assessment and receive personalised career suggestions.
- **FR-002**: Each career suggestion MUST include a title, demand indicator,
  salary range, and an option to generate a personalised roadmap.
- **FR-003**: The platform MUST display learning roadmaps as interactive node
  graphs with ordered milestones.
- **FR-004**: Each roadmap node MUST contain at minimum a resource list and a
  task list; tests are NOT attached to individual nodes.
- **FR-004a**: Each roadmap MUST include 1–3 milestone tests placed at
  intervals across the roadmap; the number of tests is determined by topic
  length and complexity and configured at roadmap creation time.
- **FR-005**: The platform MUST support three AI-generated milestone test
  formats: MCQ, question-and-answer, and coding tests.
- **FR-005a**: A student MUST score ≥ 70% on a milestone test to unlock the
  next section of the roadmap; sections remain locked until this threshold
  is met.
- **FR-006**: Students MUST be able to track node completion and roadmap progress
  persistently across sessions.
- **FR-007**: The platform MUST provide an AI chatbot capable of answering
  student questions in natural language.
- **FR-008**: The chatbot MUST be able to recommend resources and reference the
  student's current roadmap context when available.
- **FR-008a**: All chatbot conversations MUST be persisted permanently to the
  student's account and be retrievable across sessions.
- **FR-008b**: The chatbot MUST enforce a strict educational content policy;
  off-topic, harmful, and non-educational requests MUST be declined with a
  clear redirect message. The chatbot MUST NOT answer questions unrelated to
  learning, career development, or the student's roadmap.
- **FR-009**: The platform MUST provide a coding practice module where students
  select language, topic, and difficulty level.
- **FR-010**: Submitted coding solutions MUST be evaluated by the AI judge,
  returning correctness and style feedback with an XP award.
- **FR-011**: The platform MUST implement a gamification system with XP, badges,
  and streaks tied to coding practice and roadmap completion.
- **FR-012**: The platform MUST provide a progress dashboard displaying study
  hours, roadmap completion, test scores, and coding statistics.
- **FR-013**: Authentication is required to access ANY platform feature;
  unauthenticated users MUST be redirected to sign-in/sign-up before seeing
  assessment, roadmap, chatbot, practice, or progress content.
- **FR-014**: All AI-generated content MUST be clearly labelled as AI-generated.
- **FR-015**: The platform MUST degrade gracefully when the AI service is
  unavailable, surfacing user-friendly errors and not losing submitted data.

### Key Entities

- **Student**: Authenticated user with profile, assessment answers, enrolled
  roadmaps, XP total, badges, streak counter, and progress records.
- **Career**: A career path with title, description, demand indicator, salary
  range, and an associated roadmap template.
- **Roadmap**: An ordered collection of nodes linked to a career; tracks overall
  completion percentage per student.
- **Node**: A single learning milestone inside a roadmap; contains resources
  and tasks; tracks completion state per student. Nodes do not have individual
  tests — tests are at milestone level.
- **Resource**: A learning asset (video, article, note) attached to a node.
- **MilestoneTest**: An AI-generated assessment placed at a checkpoint in the
  roadmap (1–3 per roadmap); records type (MCQ / Q&A / coding), questions,
  student responses, score, and pass/fail status (pass threshold: 70%).
  Unlocks the next roadmap section when passed.
- **ChatMessage**: A single conversational turn linked to a student and
  optionally to a roadmap node context. Conversations are saved permanently
  to the student's account and are fully scrollable across sessions.
- **CodingChallenge**: A generated problem with language, topic, difficulty,
  starter code, student submission, and AI evaluation result.
- **ProgressRecord**: Aggregate metrics per student — study hours, nodes
  completed, tests taken, average scores, and coding stats.
- **Badge**: An achievement record awarded when a gamification threshold is met;
  linked to a student.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new student can complete the career assessment and view
  personalised career suggestions in under 2 minutes from first landing.
- **SC-002**: Students can navigate to and start any roadmap node within
  3 clicks from the dashboard.
- **SC-003**: AI-generated tests are returned to the student within 10 seconds
  of the request under normal load.
- **SC-004**: Chatbot responses begin streaming within 5 seconds of message
  submission under normal conditions.
- **SC-005**: Coding challenge evaluations complete and return feedback within
  15 seconds of submission under normal load.
- **SC-006**: Progress data is accurately reflected in the dashboard within
  5 seconds of a student completing an activity.
- **SC-007**: The platform supports at least 100 concurrent active students
  without degradation in response times.
- **SC-008**: AI service failures result in graceful error messages with zero
  data loss for in-flight submissions.
- **SC-009**: 90% of students who complete the career assessment proceed to
  start at least one roadmap node.
- **SC-010**: Students who use the coding practice module at least 3 times in
  a week return the following week at a rate of ≥ 60%.

---

## Clarifications

### Session 2026-05-25

- Q: Can a guest (unauthenticated) user access the assessment or any platform feature? → A: No — authentication is required before accessing ANY feature; all routes are protected.
- Q: What is the test structure and passing threshold for roadmap progression? → A: Tests are milestone-based (1–3 per roadmap depending on topic length), NOT per-node. Students must score ≥ 70% to unlock the next roadmap section; failing locks remaining content until the threshold is met.
- Q: Are chatbot conversations saved permanently or session-only? → A: Permanently saved to the student's account and fully scrollable across sessions.
- Q: Should the chatbot enforce a content policy for off-topic or harmful requests? → A: Strict educational-only policy — chatbot MUST decline all off-topic, harmful, and non-educational questions with a redirect message.
- Q: What is explicitly out of scope for v1? → A: Admin dashboard, multi-language UI support, native mobile app, payments/subscriptions. Platform is a plain Next.js web application (already initialised).

---

## Out of Scope (v1)

The following are explicitly excluded from v1 and MUST NOT be designed for
or implemented unless a new spec is raised:

- **Admin dashboard**: No internal admin UI for managing students, roadmaps, or content.
- **Multi-language UI**: Platform is English-only; no internationalisation (i18n) infrastructure.
- **Native mobile app**: Web-only; no iOS, Android, or React Native application.
- **Payments / subscriptions**: No billing, paywalls, or premium tiers — all features are free and ungated beyond authentication.
- **Social / peer features**: No forums, peer messaging, study groups, or leaderboards.

---

## Assumptions

- Students are university-level or self-directed learners; no age-gating or
  parental controls are required in v1.
- The assessment is a structured form (not a free-text interview); the exact
  question set is to be defined during planning.
- AI-generated roadmaps are seeded from a curated career template library;
  fully dynamic generation is a future enhancement.
- Study hours are tracked via active time on roadmap nodes (time-on-page
  heuristic); precise time-tracking tooling is out of scope for v1.
- Badge and XP thresholds are defined by the team during planning; exact values
  are not specified in this spec.
- The coding editor is browser-based; no desktop IDE integration in v1.
- The Next.js application is already initialised; no project scaffolding is required.

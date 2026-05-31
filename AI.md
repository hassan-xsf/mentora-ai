# AI Integration Documentation

## Infrastructure

| | |
|---|---|
| **Service** | Mentora AI HTTP endpoint |
| **Client** | `src/lib/ai/client.ts` — thin `fetch` wrapper |
| **Helpers** | `src/lib/ai/stream.ts` — `chatCompletion()`, `streamChatCompletion()`, `chatCompletionWithHistory()`, `streamChatWithHistory()` |
| **Env vars** | `AI_API_URL`, `AI_SECRET_TOKEN` |

The service exposes a single GET endpoint:

```ts
const res = await fetch(`${AI_API_URL}?query=${encodeURIComponent(prompt)}`, {
  headers: { "x-secret-token": AI_SECRET_TOKEN },
});
const { response } = await res.json();
```

All call sites — career suggestions, roadmap generation, challenge creation, milestone test generation, code evaluation, and chat — fold their prompts into a single `query` string and hit this same endpoint. Chat history is serialised as labelled turns (`User: …` / `Assistant: …`) before being sent.

### Prompt strategy

All prompts except the chat tutor are **JSON-first**: they explicitly instruct the model to return only a valid JSON object or array with a precise schema, no markdown, no explanation. Every call site has a hardcoded fallback that activates if JSON parsing fails, so the app never crashes due to a malformed AI response.

---

## Call Sites

### 1. Career Suggestions

| | |
|---|---|
| **File** | `src/app/actions/career-suggestions.ts` |
| **Triggered by** | Submitting the 10-question assessment |
| **Helper used** | `chatCompletion()` |
| **Output format** | JSON array — 5 career objects |

**Prompt:**
```
You are a career counselor AI. Based on the following student assessment answers,
suggest exactly 5 suitable tech careers.

Assessment answers: [student answers as JSON]

Return ONLY a valid JSON array with exactly 5 objects. Each object must have:
- title: string
- description: string
- fit_score: number (0–100)
- demand_indicator: "High" | "Medium" | "Low"
- salary_min: number
- salary_max: number
- salary_currency: "USD"
- why_good_fit: string (2–3 sentences)

Return ONLY the JSON array, no markdown, no explanation.
```

**Output used for:** Career cards on `/assessment/results` — fit score bars, salary ranges, demand badges, and the "Why this fits you" section.

**Fallback:** Returns 5 hardcoded tech careers (Software Engineer, Data Scientist, UX Designer, DevOps Engineer, Cybersecurity Analyst).

---

### 2. Learning Roadmap Generation

| | |
|---|---|
| **File** | `src/app/actions/generate-roadmap.ts` |
| **Triggered by** | Clicking "Generate Roadmap" on a career result card |
| **Helper used** | `chatCompletion()` |
| **Output format** | JSON object — full roadmap tree |

**Prompt:**
```
You are a curriculum designer AI. Generate a comprehensive learning roadmap
for someone who wants to become a [careerTitle].

Career description: [careerDescription]

Return ONLY a valid JSON object with this exact structure:
{
  "title": "string (e.g. 'Become a [careerTitle]')",
  "sections": [
    {
      "title": "string (e.g. 'Foundations')",
      "nodes": [
        {
          "title": "string",
          "description": "string (2–3 sentences)",
          "resources": [
            { "title": "string", "type": "video|article|note", "url": "string or null" }
          ],
          "tasks": [
            { "title": "string (actionable task)" }
          ]
        }
      ]
    }
  ]
}

Requirements:
- Exactly 3 sections (e.g. Foundations, Intermediate, Advanced)
- Each section: 3–5 nodes
- Each node: 2–3 resources and 2–4 tasks
- Resource types must be exactly: video, article, or note
- URLs can be null if not known
- Return ONLY the JSON, no markdown, no explanation
```

**Output used for:** The entire roadmap structure — sections, nodes, resources, and tasks are all inserted into the database from this single AI response. A milestone test row is also created per section. This is the most structurally complex prompt in the app.

**Fallback:** Returns a minimal roadmap with one Foundations section and one introductory node.

---

### 3. Coding Challenge Generation

| | |
|---|---|
| **File** | `src/app/actions/generate-challenge.ts` |
| **Triggered by** | Clicking "Generate Challenge" on `/practice` |
| **Helper used** | `chatCompletion()` |
| **Output format** | JSON object — challenge definition |

**Prompt:**
```
You are a coding challenge generator. Create a [difficulty] difficulty coding challenge.

Language: [language]
Topic: [topic]
Difficulty: [difficulty]

Return ONLY a valid JSON object with these exact fields:
- title: string (short challenge title)
- problem_statement: string (clear problem description, 2–4 paragraphs,
  include example inputs/outputs)
- starter_code: string (starter code template in [language] with function
  signature and comments)
- expected_output_description: string (brief description of correct output)

Return ONLY the JSON, no markdown, no explanation, no code blocks.
```

**Output used for:** The problem panel of the challenge editor (title, problem statement, example blocks) and the starter code pre-loaded in the CodeMirror editor.

**Fallback:** Returns a generic "Arrays" challenge with a reverse-list problem.

---

### 4. Milestone Test Question Generation

| | |
|---|---|
| **File** | `src/app/actions/generate-milestone-test.ts` |
| **Triggered by** | First time a student opens a milestone test |
| **Helper used** | `chatCompletion()` |
| **Output format** | JSON array — 5 MCQ question objects |

**Prompt:**
```
You are an educational quiz generator. Create exactly 5 multiple-choice questions
for a milestone test.

Section: "[sectionTitle]"
Topics covered: [comma-separated node titles]

Return ONLY a valid JSON array with exactly 5 objects. Each object must have:
- id: "q1" | "q2" | "q3" | "q4" | "q5"
- question: string
- type: "mcq"
- options: string[] (exactly 4 options)
- correct_answer: string (must match one of the options exactly)

Return ONLY the JSON array, no markdown, no explanation.
```

**Output used for:** Questions stored in `milestone_tests.questions` (JSONB) and displayed in the test form. Generated once per test and cached — the same questions are reused on repeat visits.

**Fallback:** Generates 5 generic questions based on the node topic titles.

---

### 5. Code Evaluation

| | |
|---|---|
| **File** | `src/app/api/practice/evaluate/route.ts` |
| **Triggered by** | Clicking "Run & Submit" in the challenge editor |
| **Helper used** | `chatCompletion()` |
| **Output format** | JSON object — evaluation result |

**Prompt:**
```
You are a code evaluator. Evaluate the following [language] code submission
for a coding challenge.

Problem: [problem_statement]

Student's code:
```[language]
[student code]
```

Return ONLY a valid JSON object with these fields:
- passed: boolean
- correctness_score: number (0–100)
- style_score: number (0–100)
- feedback: string (2–3 constructive sentences)
- xp_earned: number (10 for easy, 25 for medium, 50 for hard — proportional
  if not fully passing)

Return ONLY the JSON, no markdown, no explanation.
```

**Output used for:** The results panel in the editor — pass/fail badge, animated score bars, AI feedback text. Also used to award XP (written to `students.xp_total`), check badge thresholds, update `coding_challenges.status` to `"evaluated"`, and write to `progress_records`.

**Fallback:** Returns 50/50 scores with generic constructive feedback.

---

### 6. AI Tutor Chat

| | |
|---|---|
| **File** | `src/app/api/chat/route.ts` |
| **Triggered by** | Sending a message in the chat widget |
| **Helper used** | `streamChatWithHistory()` (streaming) |
| **Output format** | Token stream — plain text |

**System prompt:**
```
You are an AI educational assistant for students learning new career skills.
You ONLY answer questions related to education, learning, programming, technology,
career development, and academic topics. If a user asks about anything unrelated
to education or learning, politely decline and redirect them to educational topics.
Keep responses clear, encouraging, and educational. Use examples and explanations
that help students learn. Do not discuss politics, entertainment gossip, illegal
activities, or any off-topic subjects.
```

**Node context injection (when on a roadmap node):**
```
The student is currently studying: [node title]
Topic description: [node description]
Help them understand this topic specifically.
```

**Output used for:** Streamed token-by-token back to the chat UI via a `ReadableStream`. Both the user message and the assistant response are saved to `chat_messages` in the database after the stream completes.

---

## Summary

| Feature | File | Prompt output | XP awarded |
|---|---|---|---|
| Career suggestions | `actions/career-suggestions.ts` | 5 career objects | — |
| Roadmap generation | `actions/generate-roadmap.ts` | Full roadmap tree | — |
| Coding challenge | `actions/generate-challenge.ts` | Problem + starter code | — |
| Milestone test | `actions/generate-milestone-test.ts` | 5 MCQ questions | — |
| Code evaluation | `api/practice/evaluate/route.ts` | Scores + feedback | Yes (10 / 25 / 50) |
| AI Tutor chat | `api/chat/route.ts` | Streamed text | — |

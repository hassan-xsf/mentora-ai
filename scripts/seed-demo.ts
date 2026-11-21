/**
 * Creates (or refreshes) the shared demo student behind "Try the demo".
 *
 *   npx tsx scripts/seed-demo.ts          seed once; a no-op (password refresh only) if already seeded
 *   npx tsx scripts/seed-demo.ts --reset  wipe the demo student's data and seed it again
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, DEMO_EMAIL, DEMO_PASSWORD
 * from .env.local (DEMO_* default to the values documented in .env.example).
 * Parts whose tables/columns don't exist yet (migrations not applied) are
 * skipped with a warning.
 */
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { computeProfile } from "../src/lib/assessment/profile";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fine when the env is already exported
}

const RESET = process.argv.includes("--reset");
const EMAIL = (process.env.DEMO_EMAIL || "demo@mentora.app").toLowerCase();
const PASSWORD = process.env.DEMO_PASSWORD || "MentoraDemo2026!";
const NAME = "Ayesha Khan";
const MARKER_TITLE = "Frontend Developer Roadmap";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set (.env.local).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// ─── helpers ────────────────────────────────────────────────────────────────

type DbError = { code?: string; message: string } | null;
// Postgres / PostgREST codes for "relation or column does not exist".
const MISSING_CODES = new Set(["42P01", "PGRST205", "42703", "PGRST204"]);
const isMissing = (e: DbError) => !!e && (MISSING_CODES.has(e.code ?? "") || /does not exist|schema cache/i.test(e.message));

const seen = new Map<string, boolean>();
/** True when `table` (and `column`, if given) exists in the live schema. */
async function has(table: string, column = "*"): Promise<boolean> {
  const k = `${table}.${column}`;
  if (!seen.has(k)) {
    const { error } = await db.from(table).select(column).limit(1);
    if (error && !isMissing(error)) throw new Error(`${table}: ${error.message}`);
    seen.set(k, !error);
  }
  return seen.get(k)!;
}

const skipped = new Set<string>();
function skip(what: string, why: string) {
  if (skipped.has(`${what} (${why})`)) return;
  skipped.add(`${what} (${why})`);
  console.warn(`  ! skipped ${what}: ${why}`);
}

async function ok<T>(p: PromiseLike<{ data: T; error: DbError }>, what: string): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

const DAY = 86_400_000;
/** ISO timestamp `n` days ago at roughly `hour`:00 Pakistan time (UTC+5). */
const daysAgo = (n: number, hour = 19) => {
  const d = new Date(Date.now() - n * DAY);
  d.setUTCHours(hour - 5, randomInt(0, 59), 0, 0);
  return d.toISOString();
};
const karachiDay = (n = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(Date.now() - n * DAY);

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // same alphabet as src/lib/db/certificates.ts
const certCode = () => {
  const block = () => Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  return `MNT-${block()}-${block()}`;
};

// ─── content ────────────────────────────────────────────────────────────────

type SeedNode = {
  title: string;
  description: string;
  resources: { title: string; type: "video" | "article" | "note"; url?: string; content?: string }[];
  tasks: string[];
  children?: SeedNode[];
};
type SeedSection = { title: string; nodes: SeedNode[] };

const mdn = (path: string) => `https://developer.mozilla.org/en-US/docs/${path}`;
const n = (title: string, description: string, resources: SeedNode["resources"], tasks: string[], children?: SeedNode[]): SeedNode => ({
  title,
  description,
  resources,
  tasks,
  children,
});

const FRONTEND: SeedSection[] = [
  {
    title: "Foundations",
    nodes: [
      n("HTML & semantic markup", "Structure pages with meaningful elements so browsers, search engines and screen readers understand them.",
        [{ title: "MDN: HTML basics", type: "article", url: mdn("Learn/Getting_started_with_the_web/HTML_basics") },
         { title: "Why semantics matter", type: "note", content: "Use <header>, <nav>, <main>, <article> and <button> for what they are. A <div> with a click handler is not a button." }],
        ["Build a personal profile page using only semantic elements", "Validate it with the W3C validator"],
        [n("Forms & accessibility", "Labels, input types and error messages that work for everyone.",
          [{ title: "MDN: Web forms", type: "article", url: mdn("Learn/Forms") }],
          ["Build a sign-up form with labelled inputs", "Navigate it using only the keyboard"])]),
      n("CSS layout: Flexbox & Grid", "Lay out pages in one and two dimensions without fighting floats.",
        [{ title: "MDN: Flexbox", type: "article", url: mdn("Learn/CSS/CSS_layout/Flexbox") },
         { title: "MDN: Grids", type: "article", url: mdn("Learn/CSS/CSS_layout/Grids") }],
        ["Recreate a navbar with Flexbox", "Build a 3-column card grid with CSS Grid"],
        [n("Responsive design", "Media queries and fluid units so one page fits every screen.",
          [{ title: "MDN: Responsive design", type: "article", url: mdn("Learn/CSS/CSS_layout/Responsive_Design") }],
          ["Make your card grid collapse to one column on phones"])]),
      n("JavaScript fundamentals", "Variables, functions, arrays, objects and control flow.",
        [{ title: "MDN: JavaScript first steps", type: "article", url: mdn("Learn/JavaScript/First_steps") }],
        ["Solve 5 array exercises with map, filter and reduce", "Write a function that counts words in a sentence"],
        [n("DOM & events", "Read and change the page from JavaScript and react to user input.",
          [{ title: "MDN: Manipulating documents", type: "article", url: mdn("Learn/JavaScript/Client-side_web_APIs/Manipulating_documents") }],
          ["Build a to-do list that adds and removes items"])]),
    ],
  },
  {
    title: "Intermediate",
    nodes: [
      n("React components & props", "Split UI into reusable components and pass data down with props.",
        [{ title: "react.dev: Your first component", type: "article", url: "https://react.dev/learn/your-first-component" }],
        ["Turn your profile page into React components", "Pass the user's name as a prop"],
        [n("Lists & keys", "Render arrays of data and give React stable keys.",
          [{ title: "react.dev: Rendering lists", type: "article", url: "https://react.dev/learn/rendering-lists" }],
          ["Render your to-do list from an array"])]),
      n("State & effects", "Make components interactive with useState and sync with the outside world using useEffect.",
        [{ title: "react.dev: State", type: "article", url: "https://react.dev/learn/state-a-components-memory" },
         { title: "react.dev: Synchronizing with effects", type: "article", url: "https://react.dev/learn/synchronizing-with-effects" }],
        ["Add a counter with useState", "Save the to-do list to localStorage with useEffect", "Clean up an interval in an effect"],
        [n("Custom hooks", "Extract reusable stateful logic into your own hooks.",
          [{ title: "react.dev: Reusing logic with custom hooks", type: "article", url: "https://react.dev/learn/reusing-logic-with-custom-hooks" }],
          ["Write a useLocalStorage hook"])]),
      n("Fetching data", "Load data from an API and show loading and error states.",
        [{ title: "MDN: Using Fetch", type: "article", url: mdn("Web/API/Fetch_API/Using_Fetch") }],
        ["Show a list of GitHub repos for a username"],
        [n("Error & loading states", "Never leave the user staring at a blank screen.",
          [{ title: "Designing empty and error states", type: "note", content: "Every async view has four states: idle, loading, success and error. Design all four." }],
          ["Add a retry button to your repo list"])]),
    ],
  },
  {
    title: "Advanced",
    nodes: [
      n("Testing with Vitest", "Write unit and component tests so refactors don't break things.",
        [{ title: "Vitest: Getting started", type: "article", url: "https://vitest.dev/guide/" }],
        ["Write 3 tests for your useLocalStorage hook"]),
      n("Web performance", "Measure and improve loading speed and Core Web Vitals.",
        [{ title: "web.dev: Learn performance", type: "article", url: "https://web.dev/learn/performance" }],
        ["Run Lighthouse on your project and fix the top issue"]),
      n("Deploying your app", "Ship to the web with a custom domain and environment variables.",
        [{ title: "Vercel: Deploying", type: "article", url: "https://vercel.com/docs/deployments/overview" }],
        ["Deploy your project and share the link"]),
    ],
  },
];

const GIT: SeedSection[] = [
  {
    title: "Foundations",
    nodes: [
      n("Git basics", "Track changes with commits and understand the working tree, staging area and history.",
        [{ title: "Pro Git: Getting started", type: "article", url: "https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F" }],
        ["Initialise a repo and make 3 commits", "Undo a change with git restore"]),
      n("Branches & merging", "Work on features in isolation and merge them back.",
        [{ title: "Pro Git: Branching", type: "article", url: "https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell" }],
        ["Create a feature branch and merge it", "Resolve a merge conflict"]),
      n("GitHub & pull requests", "Push to a remote, open a pull request and review code.",
        [{ title: "GitHub Docs: About pull requests", type: "article", url: "https://docs.github.com/en/pull-requests" }],
        ["Push your repo to GitHub", "Open and merge a pull request"]),
    ],
  },
];

type Q = { id: string; type: "mcq"; question: string; options: string[]; correct_answer: string; topic: string; node?: string };
const FOUNDATIONS_TEST: Q[] = [
  { id: "q1", type: "mcq", topic: "HTML & semantic markup", node: "HTML & semantic markup", question: "Which element should wrap the main navigation links of a page?", options: ["<div>", "<nav>", "<section>", "<menu>"], correct_answer: "<nav>" },
  { id: "q2", type: "mcq", topic: "CSS layout: Flexbox & Grid", node: "CSS layout: Flexbox & Grid", question: "Which property makes a flex container place items in a column?", options: ["flex-wrap: column", "flex-direction: column", "align-items: column", "display: column"], correct_answer: "flex-direction: column" },
  { id: "q3", type: "mcq", topic: "JavaScript fundamentals", node: "JavaScript fundamentals", question: "What does [1, 2, 3].map(x => x * 2) return?", options: ["[2, 4, 6]", "6", "[1, 2, 3]", "undefined"], correct_answer: "[2, 4, 6]" },
  { id: "q4", type: "mcq", topic: "Responsive design", node: "Responsive design", question: "Which CSS feature applies styles only below a screen width?", options: ["@supports", "@media (max-width: …)", "@import", "@layer"], correct_answer: "@media (max-width: …)" },
  { id: "q5", type: "mcq", topic: "DOM & events", node: "DOM & events", question: "Which method attaches a click handler to an element?", options: ["el.onClick()", "el.addEventListener('click', fn)", "el.listen('click', fn)", "el.bind('click', fn)"], correct_answer: "el.addEventListener('click', fn)" },
];
// The demo student got q4 wrong: that topic becomes a review item.
const FOUNDATIONS_ANSWERS: Record<string, string> = { q1: "<nav>", q2: "flex-direction: column", q3: "[2, 4, 6]", q4: "@supports", q5: "el.addEventListener('click', fn)" };

const GIT_TEST: Q[] = [
  { id: "g1", type: "mcq", topic: "Git basics", node: "Git basics", question: "Which command stages a file for the next commit?", options: ["git commit file", "git add file", "git push file", "git stage --commit"], correct_answer: "git add file" },
  { id: "g2", type: "mcq", topic: "Branches & merging", node: "Branches & merging", question: "Which command creates and switches to a new branch?", options: ["git branch -d x", "git switch -c x", "git merge x", "git checkout --orphan"], correct_answer: "git switch -c x" },
  { id: "g3", type: "mcq", topic: "GitHub & pull requests", node: "GitHub & pull requests", question: "What is a pull request for?", options: ["Downloading a repo", "Proposing changes for review before merging", "Deleting a branch", "Reverting a commit"], correct_answer: "Proposing changes for review before merging" },
];

const CHALLENGES = [
  {
    language: "Python", topic: "Strings", difficulty: "easy", title: "Count the vowels",
    problem_statement: "Read one line of text from standard input and print how many vowels (a, e, i, o, u, case-insensitive) it contains.",
    starter_code: "line = input()\n# your code here\n",
    student_submission: "line = input()\nprint(sum(1 for ch in line.lower() if ch in 'aeiou'))\n",
    tests: [{ input: "Hello World", output: "3" }, { input: "Mentora", output: "3" }, { input: "rhythm", output: "0", hidden: true }, { input: "AEIOU aeiou", output: "10", hidden: true }],
    passed: true, correctness: 100, style: 88, xp: 10, ago: 9,
    feedback: "All 4 tests passed. Clean generator expression; lowering the string once keeps it readable.",
  },
  {
    language: "JavaScript", topic: "Arrays", difficulty: "easy", title: "Sum of even numbers",
    problem_statement: "Read space-separated integers from standard input and print the sum of the even ones.",
    starter_code: "const nums = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n// your code here\n",
    student_submission: "const nums = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(nums.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0));\n",
    tests: [{ input: "1 2 3 4", output: "6" }, { input: "7 9 11", output: "0" }, { input: "-2 -4 5", output: "-6", hidden: true }],
    passed: true, correctness: 100, style: 92, xp: 10, ago: 6,
    feedback: "All 3 tests passed. filter + reduce with a 0 initial value correctly handles an all-odd input.",
  },
  {
    language: "Python", topic: "Lists", difficulty: "medium", title: "Second largest number",
    problem_statement: "Read space-separated integers from standard input. Print the second-largest distinct value, or None if there isn't one.",
    starter_code: "nums = list(map(int, input().split()))\n# your code here\n",
    student_submission: "nums = list(map(int, input().split()))\nuniq = sorted(set(nums))\nprint(uniq[-2] if len(uniq) > 1 else None)\n",
    tests: [{ input: "3 1 4", output: "3" }, { input: "5 5 2", output: "2" }, { input: "9", output: "None", hidden: true }, { input: "-1 -7", output: "-7", hidden: true }],
    passed: true, correctness: 100, style: 80, xp: 25, ago: 3,
    feedback: "All 4 tests passed. Handling the single-value case before indexing was the key edge case.",
  },
  {
    language: "Python", topic: "Dictionaries", difficulty: "medium", title: "Most frequent word",
    problem_statement: "Read a line of text from standard input and print the word that appears most often (lower-cased). On a tie, print the one that appears first.",
    starter_code: "words = input().lower().split()\n# your code here\n",
    student_submission: "words = input().lower().split()\ncounts = {}\nfor w in words:\n    counts[w] = counts.get(w, 0) + 1\nprint(max(counts, key=counts.get))\n",
    tests: [{ input: "the cat and the hat", output: "the" }, { input: "a b b a", output: "a" }, { input: "stop, stop now", output: "stop", hidden: true }],
    passed: false, correctness: 67, style: 75, xp: 0, ago: 1,
    feedback: "2 of 3 tests passed. One hidden test has punctuation stuck to a word (\"stop,\"), so it was counted as a different word. Strip punctuation before counting.",
  },
] as const;

// ─── main ───────────────────────────────────────────────────────────────────

async function findUserId(): Promise<string | null> {
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === EMAIL);
    if (hit) return hit.id;
    if (data.users.length < 1000) return null;
  }
}

async function ensureUser(): Promise<string> {
  const existing = await findUserId();
  const attrs = { password: PASSWORD, email_confirm: true, user_metadata: { full_name: NAME } };
  if (existing) {
    const { error } = await db.auth.admin.updateUserById(existing, attrs);
    if (error) throw new Error(`updateUser: ${error.message}`);
    return existing;
  }
  const { data, error } = await db.auth.admin.createUser({ email: EMAIL, ...attrs });
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
  return data.user.id;
}

const STUDENT_TABLES = [
  "notifications", "badges", "coding_submissions", "coding_challenges", "certificates", "review_items",
  "remedial_plans", "milestone_question_results", "milestone_test_attempts", "milestone_test_sessions",
  "unlocked_sections", "node_task_completions", "node_completions", "roadmaps", "xp_events", "assessments",
  "study_time_events", "chat_messages", "project_blueprints", "credit_transactions", "progress_records",
  "saved_internships", "ai_feedback",
];

async function wipe(studentId: string) {
  for (const t of STUDENT_TABLES) {
    if (!(await has(t, "student_id"))) continue;
    await ok(db.from(t).delete().eq("student_id", studentId), `wipe ${t}`);
  }
}

type NodeRow = { id: string; title: string; section_index: number };

/** Inserts a roadmap the same shape create_roadmap() writes: trunk nodes + children, resources, tasks, one test per section. */
async function insertRoadmap(studentId: string, title: string, sections: SeedSection[], careerId: string | null, createdAgo: number) {
  const roadmap = await ok(
    db.from("roadmaps").insert({ student_id: studentId, title, career_id: careerId, completion_percentage: 0, created_at: daysAgo(createdAgo, 17) }).select("id").single(),
    "insert roadmap"
  ) as { id: string };
  const hasLinkKind = await has("resources", "link_kind");
  const nodes: (NodeRow & { tasks: { id: string }[] })[] = [];

  async function addNode(node: SeedNode, position: number, section: number, parentId: string | null, side: string | null) {
    const row = await ok(
      db.from("nodes").insert({ roadmap_id: roadmap.id, title: node.title, description: node.description, position, section_index: section, parent_id: parentId, branch_side: side }).select("id, title, section_index").single(),
      "insert node"
    ) as NodeRow;
    await ok(db.from("resources").insert(node.resources.map((r) => ({
      node_id: row.id, title: r.title, type: r.type, url: r.url ?? null, content: r.content ?? null,
      ...(hasLinkKind ? { link_kind: r.url ? "direct" : "none" } : {}),
    }))), "insert resources");
    const tasks = await ok(db.from("node_tasks").insert(node.tasks.map((t, i) => ({ node_id: row.id, title: t, position: i }))).select("id"), "insert tasks") as { id: string }[];
    nodes.push({ ...row, tasks });
    return row.id;
  }

  const tests: { id: string; section_index: number }[] = [];
  for (const [s, section] of sections.entries()) {
    for (const [i, node] of section.nodes.entries()) {
      const trunk = await addNode(node, i, s, null, null);
      for (const [c, child] of (node.children ?? []).entries()) await addNode(child, c, s, trunk, c % 2 === 0 ? "right" : "left");
    }
    const t = await ok(db.from("milestone_tests").insert({ roadmap_id: roadmap.id, section_index: s, type: "mcq", title: `${section.title} Milestone Test`, questions: [] }).select("id, section_index").single(), "insert test") as { id: string; section_index: number };
    tests.push(t);
  }
  return { id: roadmap.id, nodes, tests };
}

async function completeNodes(studentId: string, nodes: { id: string; tasks: { id: string }[] }[], startAgo: number) {
  for (const [i, node] of nodes.entries()) {
    const at = daysAgo(Math.max(0, startAgo - i), 20);
    await ok(db.from("node_completions").insert({ node_id: node.id, student_id: studentId, is_completed: true, completed_at: at }), "complete node");
    if (node.tasks.length) {
      await ok(db.from("node_task_completions").insert(node.tasks.map((t) => ({ task_id: t.id, student_id: studentId, is_completed: true }))), "complete tasks");
    }
  }
}

/** Stores the questions on the test and a graded attempt; returns the attempt id. */
async function passTest(studentId: string, testId: string, nodes: NodeRow[], questions: Q[], answers: Record<string, string>, ago: number) {
  const stored = questions.map((q) => ({ ...q, node_id: nodes.find((x) => x.title === q.node)?.id ?? null, node: undefined }));
  await ok(db.from("milestone_tests").update({ questions: stored }).eq("id", testId), "store questions");
  const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length;
  const score = Math.round((correct / questions.length) * 100);
  const at = daysAgo(ago, 21);

  let sessionId: string | null = null;
  if (await has("milestone_test_sessions")) {
    const s = await ok(db.from("milestone_test_sessions").insert({ test_id: testId, student_id: studentId, questions: stored, created_at: at, submitted_at: at }).select("id").single(), "insert session") as { id: string };
    sessionId = s.id;
  }
  const attempt = await ok(
    db.from("milestone_test_attempts").insert({ test_id: testId, student_id: studentId, score, passed: score >= 70, answers, attempted_at: at, ...(sessionId ? { session_id: sessionId } : {}) }).select("id").single(),
    "insert attempt"
  ) as { id: string };

  if (await has("milestone_question_results")) {
    await ok(db.from("milestone_question_results").insert(stored.map((q, i) => ({
      attempt_id: attempt.id, student_id: studentId, question_id: q.id, position: i, node_id: q.node_id, type: "mcq",
      question: q.question, options: q.options, student_answer: answers[q.id] ?? "", correct_answer: q.correct_answer,
      is_correct: answers[q.id] === q.correct_answer, score: answers[q.id] === q.correct_answer ? 1 : 0, created_at: at,
    }))), "insert question results");
  } else skip("per-question test results", "migration 011 not applied");
  return { attemptId: attempt.id, score };
}

async function seed(studentId: string) {
  const today = karachiDay();

  // Career link for the main roadmap, if the careers table has one.
  const { data: career } = await db.from("careers").select("id").ilike("title", "%frontend%").limit(1).maybeSingle();

  console.log("  roadmap: Frontend Developer (in progress)");
  const fe = await insertRoadmap(studentId, MARKER_TITLE, FRONTEND, (career as { id: string } | null)?.id ?? null, 16);
  const sec0 = fe.nodes.filter((x) => x.section_index === 0);
  const sec1 = fe.nodes.filter((x) => x.section_index === 1);
  await completeNodes(studentId, [...sec0, ...sec1.slice(0, 2)], 14);
  // Half-done tasks on the topic the student is on now.
  const current = sec1[2];
  if (current?.tasks.length) {
    await ok(db.from("node_task_completions").insert({ task_id: current.tasks[0].id, student_id: studentId, is_completed: true }), "partial task");
  }
  const feDone = sec0.length + 2;
  await ok(db.from("roadmaps").update({ completion_percentage: Math.round((feDone / fe.nodes.length) * 100) }).eq("id", fe.id), "fe completion");
  await ok(db.from("unlocked_sections").insert([0, 1].map((s) => ({ student_id: studentId, roadmap_id: fe.id, section_index: s }))), "unlock fe");
  const feTest = await passTest(studentId, fe.tests[0].id, fe.nodes, FOUNDATIONS_TEST, FOUNDATIONS_ANSWERS, 7);

  console.log("  roadmap: Git & GitHub Essentials (completed, certificate)");
  const git = await insertRoadmap(studentId, "Git & GitHub Essentials", GIT, null, 24);
  await completeNodes(studentId, git.nodes, 22);
  await ok(db.from("roadmaps").update({ completion_percentage: 100 }).eq("id", git.id), "git completion");
  await ok(db.from("unlocked_sections").insert({ student_id: studentId, roadmap_id: git.id, section_index: 0 }), "unlock git");
  const gitAnswers = Object.fromEntries(GIT_TEST.map((q) => [q.id, q.correct_answer]));
  const gitTest = await passTest(studentId, git.tests[0].id, git.nodes, GIT_TEST, gitAnswers, 19);
  const cert = await ok(db.from("certificates").insert({
    student_id: studentId, roadmap_id: git.id, code: certCode(), title: "Git & GitHub Essentials", level: "Beginner", recipient_name: NAME, issued_at: daysAgo(19, 21),
  }).select("id, code").single(), "insert certificate") as { id: string; code: string };

  // Review: the topic missed in the Foundations test is due today.
  if (await has("review_items")) {
    const missed = fe.nodes.find((x) => x.title === "Responsive design");
    if (missed) {
      await ok(db.from("review_items").insert({ student_id: studentId, node_id: missed.id, roadmap_id: fe.id, stage: 0, due_date: today, lapses: 1, source_attempt_id: feTest.attemptId }), "insert review item");
    }
    const solid = fe.nodes.find((x) => x.title === "CSS layout: Flexbox & Grid");
    if (solid) {
      await ok(db.from("review_items").insert({ student_id: studentId, node_id: solid.id, roadmap_id: fe.id, stage: 2, due_date: karachiDay(-4), lapses: 0, last_reviewed_at: daysAgo(3) }), "insert review item");
    }
  } else skip("review items", "migration 011 not applied");

  console.log("  coding challenges");
  const has014 = await has("coding_challenges", "examples");
  const hasSecrets = await has("coding_challenge_secrets", "challenge_id");
  for (const c of CHALLENGES) {
    const at = daysAgo(c.ago, 18);
    const testsPassed = c.passed ? c.tests.length : c.tests.length - 1;
    const row = await ok(db.from("coding_challenges").insert({
      student_id: studentId, language: c.language, topic: c.topic, difficulty: c.difficulty,
      problem_statement: c.problem_statement, starter_code: c.starter_code, student_submission: c.student_submission,
      status: c.passed ? "evaluated" : "submitted", xp_awarded: c.xp, created_at: at,
      evaluation_result: {
        passed: c.passed, feedback: c.feedback, correctness_score: c.correctness, style_score: c.style, xp_earned: c.xp,
        tests_passed: testsPassed, tests_total: c.tests.length,
      },
      ...(has014 ? {
        title: c.title, validated: true, first_passed_at: c.passed ? at : null,
        examples: c.tests.filter((t) => !("hidden" in t && t.hidden)).map(({ input, output }) => ({ input, output })),
      } : {}),
    }).select("id").single(), "insert challenge") as { id: string };
    if (hasSecrets) {
      await ok(db.from("coding_challenge_secrets").insert({ challenge_id: row.id, tests: c.tests, reference_solution: c.passed ? c.student_submission : null }), "insert secrets");
    }
    if (await has("coding_submissions")) {
      await ok(db.from("coding_submissions").insert({
        challenge_id: row.id, student_id: studentId, kind: "submit", code: c.student_submission, passed: c.passed,
        tests_passed: testsPassed, tests_total: c.tests.length, correctness: c.correctness, style_score: c.style,
        feedback: c.feedback, xp_awarded: c.xp, created_at: at,
      }), "insert submission");
    }
  }
  if (!has014) skip("challenge titles/examples/hidden tests", "migration 014 not applied");

  // XP: 2 easy + 1 medium challenge + 2 milestone tests, matching the app's XP values.
  const xp = [
    { amount: 10, reason: "challenge:easy", created_at: daysAgo(9) },
    { amount: 10, reason: "challenge:easy", created_at: daysAgo(6) },
    { amount: 25, reason: "challenge:medium", created_at: daysAgo(3) },
    { amount: 100, reason: "milestone_test", created_at: daysAgo(19, 21) },
    { amount: 100, reason: "milestone_test", created_at: daysAgo(7, 21) },
  ];
  const xpTotal = xp.reduce((a, b) => a + b.amount, 0);
  if (await has("xp_events")) await ok(db.from("xp_events").insert(xp.map((e) => ({ ...e, student_id: studentId }))), "insert xp events");
  else skip("xp ledger", "migration 008 not applied");

  await ok(db.from("badges").insert([
    { student_id: studentId, name: "First Challenge", description: "Completed your first coding challenge", icon: "🎯", awarded_at: daysAgo(9) },
    { student_id: studentId, name: "Century", description: "Earned 100 XP", icon: "💯", awarded_at: daysAgo(19, 21) },
  ]), "insert badges");

  const studentPatch: Record<string, unknown> = {
    full_name: NAME, xp_total: xpTotal, streak_count: 4, last_active_date: today, credits: 1000,
  };
  if (await has("students", "onboarded_at")) studentPatch.onboarded_at = null; // tour shows on first visit
  else skip("onboarding flag", "migration 016 not applied");
  await ok(db.from("students").update(studentPatch).eq("id", studentId), "update student");
  if (await has("credit_transactions")) {
    await ok(db.from("credit_transactions").insert({ student_id: studentId, amount: 1000, reason: "signup_bonus", balance_after: 1000, created_at: daysAgo(25) }), "insert credits ledger");
  }

  await ok(db.from("progress_records").upsert({
    student_id: studentId, roadmaps_completed: 1, nodes_completed: feDone + git.nodes.length,
    milestone_tests_taken: 2, milestone_tests_avg_score: Math.round((feTest.score + gitTest.score) / 2),
    coding_challenges_completed: CHALLENGES.filter((c) => c.passed).length, study_hours_total: 9.5, updated_at: new Date().toISOString(),
  }, { onConflict: "student_id" }), "upsert progress");

  await ok(db.from("notifications").insert([
    { student_id: studentId, type: "system", title: "Welcome to Mentora 👋", body: "Start with Career Discovery to find a path that fits you.", href: "/assessment", is_read: true, created_at: daysAgo(25) },
    { student_id: studentId, type: "certificate", title: "Certificate earned 🎓", body: 'You completed "Git & GitHub Essentials". Your certificate is ready.', href: `/certificates/${cert.id}`, is_read: true, created_at: daysAgo(19, 21) },
    { student_id: studentId, type: "milestone", title: "Foundations passed", body: `You scored ${feTest.score}% and unlocked Intermediate.`, href: `/roadmap/${fe.id}`, is_read: false, created_at: daysAgo(7, 21) },
    { student_id: studentId, type: "badge", title: "Badge unlocked: First Challenge", body: "Completed your first coding challenge.", href: "/progress", is_read: false, created_at: daysAgo(9) },
  ]), "insert notifications");

  // Assessment (migration 009): answers picked from the live question bank.
  if ((await has("assessments")) && (await has("assessment_questions", "slug"))) {
    const bank = await ok(db.from("assessment_questions").select("id, slug, question, type, options").not("slug", "is", null).order("position"), "load questions") as
      { id: string; slug: string; question: string; type: string; options: string[] }[];
    const answers = bank.map((q) => ({
      question_id: q.id, slug: q.slug, question: q.question,
      answer: q.type === "multi_choice" ? q.options.slice(0, 2) : q.options[Math.min(1, q.options.length - 1)],
    }));
    const suggestions = [
      { title: "Frontend Developer", fit_score: 92, demand_indicator: "High", salary_min: 60000, salary_max: 130000, salary_currency: "USD", description: "Build the parts of websites and apps people see and use.", why_good_fit: "You enjoy visual, hands-on work and seeing results quickly.", trade_off: "Frameworks change fast, so expect to keep learning." },
      { title: "Full Stack Developer", fit_score: 84, demand_indicator: "High", salary_min: 70000, salary_max: 150000, salary_currency: "USD", description: "Build complete web applications, frontend to database.", why_good_fit: "Your interest in building whole products end to end.", trade_off: "Broad rather than deep at the start." },
      { title: "UI/UX Designer", fit_score: 76, demand_indicator: "Medium", salary_min: 50000, salary_max: 110000, salary_currency: "USD", description: "Design how products look, feel and flow.", why_good_fit: "You care about how things look and how people use them.", trade_off: "Less coding, more research and iteration." },
      { title: "Data Analyst", fit_score: 68, demand_indicator: "High", salary_min: 55000, salary_max: 100000, salary_currency: "USD", description: "Turn data into answers and dashboards.", why_good_fit: "You like spotting patterns.", trade_off: "Less visual building than you seem to enjoy." },
      { title: "QA Engineer", fit_score: 61, demand_indicator: "Medium", salary_min: 45000, salary_max: 95000, salary_currency: "USD", description: "Find bugs before users do and automate tests.", why_good_fit: "Attention to detail.", trade_off: "Can feel repetitive without automation." },
    ];
    await ok(db.from("assessments").insert({
      student_id: studentId, answers, skill_profile: computeProfile(answers), suggestions, used_fallback: false, created_at: daysAgo(25, 16),
    }), "insert assessment");
  } else skip("saved assessment", "migration 009 not applied");

  // Study time (migration 015): one row per Pakistan day and kind.
  if (await has("study_time_events", "kind")) {
    const rows = [];
    for (let d = 13; d >= 0; d--) {
      if (d % 3 === 2) continue; // a few rest days
      rows.push({ student_id: studentId, day: karachiDay(d), kind: "roadmap", minutes: 20 + ((d * 7) % 35), recorded_at: daysAgo(d, 20) });
      if (d % 2 === 0) rows.push({ student_id: studentId, day: karachiDay(d), kind: "practice", minutes: 15 + ((d * 5) % 25), recorded_at: daysAgo(d, 21) });
    }
    await ok(db.from("study_time_events").insert(rows), "insert study time");
  } else skip("study time", "migration 015 not applied");

  return { certCode: cert.code };
}

async function main() {
  console.log(`Demo account: ${EMAIL}${process.env.DEMO_EMAIL ? "" : " (default)"}`);
  const studentId = await ensureUser();
  // The signup trigger normally creates this row; make sure it exists.
  await ok(db.from("students").upsert({ id: studentId, email: EMAIL, full_name: NAME }, { onConflict: "id" }), "ensure student");

  const { data: marker } = await db.from("roadmaps").select("id").eq("student_id", studentId).eq("title", MARKER_TITLE).limit(1);
  if (marker?.length && !RESET) {
    console.log("Already seeded; password and confirmation refreshed. Use --reset to restore the seeded state.");
    return;
  }

  console.log(RESET ? "Resetting demo data…" : "Seeding demo data…");
  await wipe(studentId);
  const { certCode } = await seed(studentId);
  console.log(`Done. Certificate code: ${certCode} (check it at /verify/${certCode})`);
  if (skipped.size) console.log(`Skipped (apply migrations, then run with --reset):\n  - ${[...skipped].join("\n  - ")}`);
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

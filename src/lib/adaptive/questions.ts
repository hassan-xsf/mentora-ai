/**
 * Pure question logic for milestone tests and review checks: parsing model
 * output, canned fallbacks, stripping answers for the client, and grading.
 * No I/O here so it can be self-checked with `npx tsx`.
 */

export const PASS_MARK = 70;
export const RETRY_COOLDOWN_MS = 10 * 60_000;
export const MAX_SHORT_ANSWER = 2000;

export type TopicNode = { id: string; title: string; description: string };

/** Server-side question: holds the answer key. Never send to the client. */
export type StoredQuestion = {
  id: string;
  type: "mcq" | "short";
  question: string;
  node_id: string | null;
  topic: string;
  options?: string[];
  correct_answer?: string;
  rubric?: string;
  model_answer?: string;
};

/** What a client component may see. */
export type PublicQuestion = {
  id: string;
  type: "mcq" | "short";
  question: string;
  topic: string;
  options?: string[];
};

export function toPublic(q: StoredQuestion): PublicQuestion {
  // Built field by field so a new answer-key field can't leak by accident.
  return q.type === "mcq"
    ? { id: q.id, type: q.type, question: q.question, topic: q.topic, options: q.options }
    : { id: q.id, type: q.type, question: q.question, topic: q.topic };
}

export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** One MCQ from model output `{question, options[4], correct_index}`; null when malformed. */
export function parseMcq(
  raw: unknown,
  rand: () => number = Math.random
): { question: string; options: string[]; correct_answer: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const question = str(r.question, 600);
  if (!question || !Array.isArray(r.options) || r.options.length !== 4) return null;
  const options = r.options.map((o) => str(o, 300));
  if (options.some((o) => !o) || new Set(options).size !== 4) return null;
  const idx = Number(r.correct_index);
  if (!Number.isInteger(idx) || idx < 0 || idx > 3) return null;
  // Models put the right answer first far too often; reshuffle server-side.
  return { question, options: shuffle(options, rand), correct_answer: options[idx] };
}

/**
 * Model output → exactly 4 MCQ + 1 short answer, each tagged with its node.
 * `refs` maps the short labels shown to the model (N1, N2…) to nodes.
 * Returns null unless the full set is valid.
 */
export function parseGeneratedQuestions(
  data: unknown,
  refs: Map<string, TopicNode>,
  rand: () => number = Math.random
): StoredQuestion[] | null {
  const list = (data as { questions?: unknown })?.questions ?? data;
  if (!Array.isArray(list)) return null;

  const fallbackNode = refs.values().next().value as TopicNode | undefined;
  const nodeFor = (ref: unknown) => refs.get(String(ref ?? "").trim().toUpperCase()) ?? fallbackNode;

  const mcqs: StoredQuestion[] = [];
  let short: StoredQuestion | null = null;
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const node = nodeFor(r.topic_ref);
    const tag = { node_id: node?.id ?? null, topic: node?.title ?? "This section" };
    if (r.type === "short" && !short) {
      const question = str(r.question, 600);
      const rubric = str(r.rubric, 1200);
      if (question && rubric) {
        short = { id: "q5", type: "short", question, rubric, model_answer: str(r.model_answer, 1200), ...tag };
      }
    } else if (r.type !== "short" && mcqs.length < 4) {
      const mcq = parseMcq(r, rand);
      if (mcq) mcqs.push({ id: `q${mcqs.length + 1}`, type: "mcq", ...mcq, ...tag });
    }
  }
  return mcqs.length === 4 && short ? [...mcqs, short] : null;
}

/** Canned MCQ built from roadmap data: which topic matches this description? */
export function fallbackMcq(
  id: string,
  node: TopicNode,
  otherTitles: string[],
  rand: () => number = Math.random
): StoredQuestion {
  const distractors = shuffle(
    [...new Set(otherTitles.filter((t) => t && t !== node.title))],
    rand
  ).slice(0, 3);
  const pads = ["None of these topics", "A topic from a later section", "An unrelated tool"];
  while (distractors.length < 3) distractors.push(pads[distractors.length]);
  const question = node.description
    ? `Which topic does this describe? "${node.description.slice(0, 400)}"`
    : `Which of these topics is part of this section of your roadmap?`;
  return {
    id,
    type: "mcq",
    question,
    node_id: node.id,
    topic: node.title,
    options: shuffle([node.title, ...distractors], rand),
    correct_answer: node.title,
  };
}

/** Practice-only set used when generation fails (4 MCQ + 1 short answer). */
export function buildFallbackQuestions(
  sectionNodes: TopicNode[],
  allTitles: string[],
  sectionTitle: string,
  rand: () => number = Math.random
): StoredQuestion[] {
  const nodes = sectionNodes.length
    ? sectionNodes
    : [{ id: "", title: sectionTitle, description: "" }];
  const picks = shuffle(nodes, rand);
  const mcqs = [0, 1, 2, 3].map((i) => {
    const q = fallbackMcq(`q${i + 1}`, picks[i % picks.length], allTitles, rand);
    return q.node_id ? q : { ...q, node_id: null };
  });
  const n = picks[0];
  const short: StoredQuestion = {
    id: "q5",
    type: "short",
    question: `In 2–4 sentences, explain "${n.title}" and describe one situation where you would use it.`,
    node_id: n.id || null,
    topic: n.title,
    rubric: `Accurately explains ${n.title}${n.description ? ` (${n.description})` : ""} and gives a concrete, relevant use case.`,
    model_answer: n.description || `A clear explanation of ${n.title} with a realistic example.`,
  };
  return [...mcqs, short];
}

/**
 * Untrusted client answers → one string per known question. Unknown keys are
 * dropped; an MCQ answer must be one of its options, otherwise it's blank.
 */
export function sanitizeAnswers(
  questions: Pick<StoredQuestion, "id" | "type" | "options">[],
  raw: unknown
): Record<string, string> {
  const input = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: Record<string, string> = {};
  for (const q of questions) {
    const v = Object.prototype.hasOwnProperty.call(input, q.id) ? input[q.id] : undefined;
    if (typeof v !== "string") {
      out[q.id] = "";
    } else if (q.type === "mcq") {
      out[q.id] = q.options?.includes(v) ? v : "";
    } else {
      out[q.id] = v.trim().slice(0, MAX_SHORT_ANSWER);
    }
  }
  return out;
}

export function gradeMcq(q: Pick<StoredQuestion, "correct_answer">, answer: string): boolean {
  return !!q.correct_answer && answer === q.correct_answer;
}

/** Per-question scores (0..1) → percentage. */
export function scorePercent(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, s) => a + Math.min(Math.max(s, 0), 1), 0);
  return Math.round((sum / scores.length) * 100);
}

/** When a failed attempt's cooldown ends, or null if a new attempt may start now. */
export function cooldownEndsAt(
  last: { score: number; attempted_at: string } | null,
  now: Date
): Date | null {
  if (!last || last.score >= PASS_MARK) return null;
  const ends = new Date(Date.parse(last.attempted_at) + RETRY_COOLDOWN_MS);
  return ends > now ? ends : null;
}

/** Sanitized grade from the short-answer grader's JSON (score 0..10). */
export function parseGrade(data: unknown): { score: number; feedback: string } | null {
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  const n = Number(r.score);
  if (!Number.isFinite(n)) return null;
  return {
    score: Math.min(Math.max(Math.round(n), 0), 10) / 10,
    feedback: str(r.feedback, 600),
  };
}

/** Wraps untrusted text in tags the text itself can't close. */
export function fenceUntrusted(text: string, tag: string): string {
  const cleaned = text.replace(new RegExp(`</?${tag}>`, "gi"), "");
  return `<${tag}>\n${cleaned}\n</${tag}>`;
}

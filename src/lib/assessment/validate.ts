export type BankQuestion = {
  id: string;
  slug: string;
  question: string;
  type: "single_choice" | "multi_choice" | "scale";
  options: string[];
  is_core: boolean;
};

export type ValidAnswer = {
  question_id: string;
  slug: string;
  question: string;
  answer: string | string[];
};

/**
 * Check client-submitted answers against the question bank: ids must exist,
 * values must be allowed options, every core question must be answered.
 * Returns the answers in bank order, or an error message.
 */
export function validateAnswers(
  bank: BankQuestion[],
  raw: unknown
): { answers: ValidAnswer[] } | { error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: "No answers submitted." };
  const input = raw as Record<string, unknown>;
  const byId = new Map(bank.map((q) => [q.id, q]));

  for (const id of Object.keys(input)) {
    if (!byId.has(id)) return { error: "Unknown question in submission." };
  }

  const answers: ValidAnswer[] = [];
  for (const q of bank) {
    const v = input[q.id];
    if (v === undefined) {
      if (q.is_core) return { error: `Please answer: "${q.question}"` };
      continue;
    }
    if (q.type === "multi_choice") {
      if (!Array.isArray(v) || v.length === 0) return { error: `Pick at least one option for: "${q.question}"` };
      if (!v.every((x) => typeof x === "string" && q.options.includes(x)) || new Set(v).size !== v.length) {
        return { error: `Invalid option for: "${q.question}"` };
      }
      answers.push({ question_id: q.id, slug: q.slug, question: q.question, answer: v as string[] });
    } else {
      if (typeof v !== "string" || !q.options.includes(v)) return { error: `Invalid option for: "${q.question}"` };
      answers.push({ question_id: q.id, slug: q.slug, question: q.question, answer: v });
    }
  }
  if (answers.length === 0) return { error: "No answers submitted." };
  return { answers };
}

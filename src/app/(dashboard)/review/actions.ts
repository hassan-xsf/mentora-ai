"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { getCachedPlan, getOwnedReviewItem, today } from "@/lib/adaptive/review";
import { isDue, nextReview } from "@/lib/adaptive/schedule";
import { gradeMcq, sanitizeAnswers } from "@/lib/adaptive/questions";

export type ReviewCheckResult = {
  error?: string;
  correct?: boolean;
  /** Per check question: was it right, and the right answer. */
  results?: { correct: boolean; correctAnswer: string }[];
  /** Next due date, or null when the item wasn't due so the schedule didn't move. */
  nextDue?: string | null;
};

/** Grades the quick check server-side and moves the item along the review ladder. */
export async function submitReviewCheck(itemId: string, rawAnswers: unknown): Promise<ReviewCheckResult> {
  const user = await requireUser();
  if (typeof itemId !== "string") return { error: "Review item not found." };
  const item = await getOwnedReviewItem(itemId, user.id);
  if (!item) return { error: "Review item not found." };
  const plan = await getCachedPlan(item.node.id, user.id);
  if (!plan || plan.check_questions.length === 0) return { error: "Open the lesson first." };

  const qs = plan.check_questions.map((q, i) => ({ ...q, id: `c${i + 1}`, type: "mcq" as const }));
  const answers = sanitizeAnswers(qs, rawAnswers);
  const results = qs.map((q) => ({ correct: gradeMcq(q, answers[q.id]), correctAnswer: q.correct_answer }));
  const correct = results.every((r) => r.correct);

  const day = today();
  if (!isDue(item.due_date, day)) return { correct, results, nextDue: null };

  const next = nextReview(item.stage, correct, day);
  const { error } = await createAdminClient()
    .from("review_items")
    .update({
      stage: next.stage,
      due_date: next.dueDate,
      lapses: item.lapses + (next.lapsed ? 1 : 0),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", item.id)
    .eq("student_id", user.id);
  if (error) return { error: "Couldn't save your review. Please try again." };
  return { correct, results, nextDue: next.dueDate };
}

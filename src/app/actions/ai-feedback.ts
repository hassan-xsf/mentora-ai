"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type FeedbackRating = 1 | -1;

const FEATURE_RE = /^[a-z0-9_]{1,64}$/;

function validTarget(feature: unknown, targetId: unknown): boolean {
  return (
    typeof feature === "string" && FEATURE_RE.test(feature) &&
    typeof targetId === "string" && targetId.length > 0 && targetId.length <= 200
  );
}

/**
 * Save (or change) the student's thumbs up/down on one piece of AI output.
 * The row only ever describes the caller's own opinion, so no ownership check
 * on `targetId` is needed — at worst a student rates an id they can't see.
 */
export async function submitAIFeedback(
  feature: string,
  targetId: string,
  rating: FeedbackRating,
  comment?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  if (!validTarget(feature, targetId) || (rating !== 1 && rating !== -1)) {
    return { ok: false, error: "Invalid feedback." };
  }
  const text = typeof comment === "string" ? comment.trim() : "";
  if (text.length > 500) return { ok: false, error: "Comment must be 500 characters or fewer." };

  const { error } = await createAdminClient()
    .from("ai_feedback")
    .upsert(
      {
        student_id: user.id,
        feature,
        target_id: targetId,
        rating,
        comment: text || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "student_id,feature,target_id" }
    );
  if (error) {
    console.warn("[ai-feedback] save failed:", error.message);
    return { ok: false, error: "Couldn't save feedback right now." };
  }
  return { ok: true };
}

/** The caller's existing rating for this output, or null. */
export async function getMyAIFeedback(feature: string, targetId: string): Promise<FeedbackRating | null> {
  if (!validTarget(feature, targetId)) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await createAdminClient()
    .from("ai_feedback")
    .select("rating")
    .eq("student_id", user.id)
    .eq("feature", feature)
    .eq("target_id", targetId)
    .maybeSingle();
  return (data?.rating as FeedbackRating | undefined) ?? null;
}

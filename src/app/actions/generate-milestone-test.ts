"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { isInsufficientCredits, refundCredits, spendCredits } from "@/lib/credits/credits";
import { getOpenSession, getOwnedTest } from "@/lib/db/milestone-tests";
import { generateTestQuestions } from "@/lib/adaptive/ai";
import { buildFallbackQuestions, cooldownEndsAt } from "@/lib/adaptive/questions";
import type { Json } from "@/types/database";

/**
 * Starts a new attempt: charges credits and generates a fresh question set
 * stored server-side. Answers never leave the server; the page renders the
 * sanitized questions after this returns.
 */
export async function startMilestoneAttempt(testId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (typeof testId !== "string") return { error: "Test not found." };

  const test = await getOwnedTest(testId, user.id);
  if (!test) return { error: "Test not found." };
  if (!test.unlocked) return { error: "This section is still locked." };

  // Re-opening an unfinished attempt is free and keeps the same questions.
  if (await getOpenSession(testId, user.id)) return {};

  const admin = createAdminClient();
  const { data: last } = await admin
    .from("milestone_test_attempts")
    .select("score, attempted_at")
    .eq("test_id", testId)
    .eq("student_id", user.id)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const cooldown = cooldownEndsAt(last, new Date());
  if (cooldown) {
    const mins = Math.ceil((cooldown.getTime() - Date.now()) / 60_000);
    return { error: `Review your weak topics first — you can retry in ${mins} minute${mins === 1 ? "" : "s"}.` };
  }

  try {
    await spendCredits(user.id, "generate_milestone_test");
  } catch (err) {
    if (isInsufficientCredits(err)) return { error: err.message };
    throw err;
  }

  const [{ data: sectionNodes }, { data: allNodes }, { data: previous }] = await Promise.all([
    admin
      .from("nodes")
      .select("id, title, description")
      .eq("roadmap_id", test.roadmap_id)
      .eq("section_index", test.section_index)
      .order("position", { ascending: true }),
    admin.from("nodes").select("title").eq("roadmap_id", test.roadmap_id),
    admin
      .from("milestone_test_sessions")
      .select("questions")
      .eq("test_id", testId)
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(2),
  ]);
  const nodes = (sectionNodes ?? []).slice(0, 12);
  const avoid = (previous ?? [])
    .flatMap((s) => (s.questions as { question?: string }[]) ?? [])
    .map((q) => q.question ?? "")
    .filter(Boolean);

  let questions = await generateTestQuestions(test.title, nodes, avoid, user.id);
  const usedFallback = !questions;
  if (!questions) {
    // Canned questions are practice-only and free.
    await refundCredits(user.id, "generate_milestone_test");
    questions = buildFallbackQuestions(nodes, (allNodes ?? []).map((n) => n.title), test.title);
  }

  const { error } = await admin.from("milestone_test_sessions").insert({
    test_id: testId,
    student_id: user.id,
    questions: questions as unknown as Json,
    used_fallback: usedFallback,
  });
  if (error) {
    if (!usedFallback) await refundCredits(user.id, "generate_milestone_test");
    // 23505: a parallel request already opened an attempt — use that one.
    if (error.code === "23505") return {};
    console.error("[start-milestone-attempt] insert failed:", error.message);
    return { error: "Couldn't start the test. Please try again." };
  }
  return {};
}

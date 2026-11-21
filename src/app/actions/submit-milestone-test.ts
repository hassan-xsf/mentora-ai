"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { notify } from "@/lib/db/notifications";
import { awardXP } from "@/lib/gamification/xp";
import { updateStreak } from "@/lib/gamification/streaks";
import { updateRoadmapCompletion } from "@/lib/db/roadmaps";
import { getOwnedTest, hasPassedTest } from "@/lib/db/milestone-tests";
import { explainMistakes, gradeShortAnswer, type Mistake } from "@/lib/adaptive/ai";
import { recordWeakTopics } from "@/lib/adaptive/review";
import {
  gradeMcq,
  PASS_MARK,
  sanitizeAnswers,
  scorePercent,
  type StoredQuestion,
} from "@/lib/adaptive/questions";
import type { Json } from "@/types/database";

const MILESTONE_XP = 100;

/**
 * Grades a submitted attempt entirely server-side against the stored question
 * set. Everything (test, roadmap, section) is derived from the session row
 * owned by the caller; nothing the client sends besides answers is trusted.
 */
export async function submitMilestoneTest(sessionId: string, rawAnswers: unknown): Promise<{ error?: string }> {
  const user = await requireUser();
  if (typeof sessionId !== "string") return { error: "Attempt not found." };
  const admin = createAdminClient();

  // Claim the session first: the conditional update makes a double submit a no-op.
  const { data: session } = await admin
    .from("milestone_test_sessions")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("student_id", user.id)
    .is("submitted_at", null)
    .select("id, test_id, questions, used_fallback")
    .maybeSingle();
  if (!session) return { error: "This attempt was already submitted or doesn't exist." };

  const test = await getOwnedTest(session.test_id, user.id);
  if (!test) return { error: "Test not found." };

  const questions = session.questions as unknown as StoredQuestion[];
  const answers = sanitizeAnswers(questions, rawAnswers);

  const graded = await Promise.all(
    questions.map(async (q) => {
      const answer = answers[q.id];
      if (q.type === "mcq") {
        const ok = gradeMcq(q, answer);
        return { q, answer, score: ok ? 1 : 0, feedback: null as string | null };
      }
      const g = await gradeShortAnswer(q, answer, user.id);
      return { q, answer, score: g.score, feedback: g.feedback };
    })
  );

  const score = scorePercent(graded.map((g) => g.score));
  const practice = session.used_fallback;
  // Practice (canned) sets never count as a pass, so they can't unlock anything.
  const passed = score >= PASS_MARK && !practice;
  const firstPass = passed && !(await hasPassedTest(test.id, user.id));

  const { data: attempt, error: attemptError } = await admin
    .from("milestone_test_attempts")
    .insert({ test_id: test.id, student_id: user.id, score, passed, practice, answers, session_id: session.id })
    .select("id")
    .single();
  if (attemptError || !attempt) {
    console.error("[submit-milestone-test] attempt insert failed:", attemptError?.message);
    return { error: "Couldn't save your attempt. Please try again." };
  }

  const isCorrect = (g: (typeof graded)[number]) => (g.q.type === "mcq" ? g.score === 1 : g.score >= 0.6);
  const mistakes: Mistake[] = graded
    .filter((g) => !isCorrect(g))
    .map((g) => ({
      id: g.q.id,
      question: g.q.question,
      topic: g.q.topic,
      options: g.q.options,
      studentAnswer: g.answer,
      correctAnswer: (g.q.type === "mcq" ? g.q.correct_answer : g.q.model_answer || g.q.rubric) ?? "",
    }));
  const explanations = await explainMistakes(mistakes, user.id);

  const { error: resultsError } = await admin.from("milestone_question_results").insert(
    graded.map((g, i) => ({
      attempt_id: attempt.id,
      student_id: user.id,
      question_id: g.q.id,
      position: i,
      node_id: g.q.node_id,
      type: g.q.type,
      question: g.q.question,
      options: (g.q.options ?? null) as Json,
      student_answer: g.answer,
      correct_answer: (g.q.type === "mcq" ? g.q.correct_answer : g.q.model_answer) ?? null,
      is_correct: isCorrect(g),
      score: g.score,
      feedback: g.feedback,
      explanation: explanations[g.q.id] ?? null,
    }))
  );
  if (resultsError) console.error("[submit-milestone-test] results insert failed:", resultsError.message);

  await recordWeakTopics(
    user.id,
    test.roadmap_id,
    attempt.id,
    graded.filter((g) => !isCorrect(g) && g.q.node_id).map((g) => g.q.node_id!)
  );

  if (passed) {
    await admin
      .from("unlocked_sections")
      .upsert(
        { student_id: user.id, roadmap_id: test.roadmap_id, section_index: test.section_index + 1 },
        { onConflict: "student_id,roadmap_id,section_index" }
      );
    if (firstPass) await awardXP(user.id, MILESTONE_XP, "milestone_test");
    await updateStreak(user.id);
    await updateRoadmapCompletion(test.roadmap_id, user.id);
    await notify(
      user.id,
      "milestone",
      `Milestone passed — ${score}%`,
      `"${test.title}" cleared. The next section is unlocked.`,
      `/roadmap/${test.roadmap_id}`
    );
  }

  const { data: progress } = await admin
    .from("progress_records")
    .select("milestone_tests_taken, milestone_tests_avg_score")
    .eq("student_id", user.id)
    .maybeSingle();
  const taken = (progress?.milestone_tests_taken ?? 0) + 1;
  const avg = ((progress?.milestone_tests_avg_score ?? 0) * (taken - 1) + score) / taken;
  await admin.from("progress_records").upsert(
    {
      student_id: user.id,
      milestone_tests_taken: taken,
      milestone_tests_avg_score: avg,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" }
  );

  return {};
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import type { MilestoneQuestion } from "@/types";

type SubmitResult = {
  score: number;
  passed: boolean;
};

export async function submitMilestoneTest(
  testId: string,
  answers: Record<string, string>,
  roadmapId: string
): Promise<SubmitResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: test } = await supabase
    .from("milestone_tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (!test) throw new Error("Test not found");

  const questions = (test.questions ?? []) as MilestoneQuestion[];
  const totalQuestions = questions.length;

  if (totalQuestions === 0) {
    return { score: 0, passed: false };
  }

  // Score MCQ questions
  let correctCount = 0;
  for (const question of questions) {
    if (question.type === "mcq" && question.correct_answer) {
      const studentAnswer = answers[question.id];
      if (studentAnswer === question.correct_answer) {
        correctCount++;
      }
    } else if (question.type === "qa" || question.type === "coding") {
      // Auto-pass non-MCQ questions (graded as correct if answered)
      if (answers[question.id] && answers[question.id].trim().length > 10) {
        correctCount++;
      }
    }
  }

  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= 70;

  // Save attempt
  await supabase.from("milestone_test_attempts").insert({
    test_id: testId,
    student_id: user.id,
    score,
    passed,
    answers,
  });

  // If passed, unlock next section
  if (passed) {
    const nextSectionIndex = test.section_index + 1;
    await supabase.from("unlocked_sections").upsert(
      {
        student_id: user.id,
        roadmap_id: roadmapId,
        section_index: nextSectionIndex,
      },
      { onConflict: "student_id,roadmap_id,section_index" }
    );
  }

  // Update progress_records
  const { data: existingProgress } = await supabase
    .from("progress_records")
    .select("*")
    .eq("student_id", user.id)
    .single();

  if (existingProgress) {
    const newTotal = existingProgress.milestone_tests_taken + 1;
    const newAvg =
      (existingProgress.milestone_tests_avg_score * existingProgress.milestone_tests_taken + score) /
      newTotal;

    await supabase
      .from("progress_records")
      .update({
        milestone_tests_taken: newTotal,
        milestone_tests_avg_score: newAvg,
        updated_at: new Date().toISOString(),
      })
      .eq("student_id", user.id);
  } else {
    await supabase.from("progress_records").insert({
      student_id: user.id,
      milestone_tests_taken: 1,
      milestone_tests_avg_score: score,
    });
  }

  return { score, passed };
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatCompletion } from "@/lib/openai/stream";
import { awardXP, XP_VALUES } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import { updateStreak } from "@/lib/gamification/streaks";
import type { EvaluationResult, Difficulty } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { challengeId: string; code: string };
    const { challengeId, code } = body;

    if (!challengeId || !code) {
      return NextResponse.json({ error: "Missing challengeId or code" }, { status: 400 });
    }

    const { data: challenge } = await supabase
      .from("coding_challenges")
      .select("*")
      .eq("id", challengeId)
      .eq("student_id", user.id)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Save submission
    await supabase
      .from("coding_challenges")
      .update({ student_submission: code, status: "submitted" })
      .eq("id", challengeId);

    const prompt = `You are a code evaluator. Evaluate the following ${challenge.language} code submission for a coding challenge.

Problem:
${challenge.problem_statement}

Student's code:
\`\`\`${challenge.language}
${code}
\`\`\`

Return ONLY a valid JSON object with these exact fields:
- passed: boolean (true if the solution is functionally correct)
- correctness_score: number (0-100, how correct is the solution)
- style_score: number (0-100, code quality, readability, best practices)
- feedback: string (2-3 sentences of constructive feedback mentioning what's good and what can improve)
- xp_earned: number (10 for easy, 25 for medium, 50 for hard challenges; give partial XP proportional to correctness if not fully passing)

Return ONLY the JSON, no markdown, no explanation.`;

    let evalResult: EvaluationResult;

    try {
      const raw = await chatCompletion(prompt);
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      const parsed = JSON.parse(cleaned) as EvaluationResult & { xp_earned?: number };
      evalResult = {
        passed: Boolean(parsed.passed),
        correctness_score: Number(parsed.correctness_score ?? 0),
        style_score: Number(parsed.style_score ?? 0),
        feedback: String(parsed.feedback ?? ""),
        xp_earned: Number(parsed.xp_earned ?? 0),
      };
    } catch {
      // Fallback evaluation
      evalResult = {
        passed: code.trim().length > 20,
        correctness_score: 50,
        style_score: 50,
        feedback: "Your submission has been received. Keep practicing to improve your solution.",
        xp_earned: Math.floor(XP_VALUES[(challenge.difficulty as Difficulty) ?? "easy"] / 2),
      };
    }

    // XP based on difficulty
    const maxXP = XP_VALUES[(challenge.difficulty as Difficulty) ?? "easy"];
    const xpToAward = Math.min(evalResult.xp_earned || 0, maxXP);

    // Award XP
    if (xpToAward > 0) {
      await awardXP(user.id, xpToAward);
    }

    // Update challenge record
    await supabase
      .from("coding_challenges")
      .update({
        evaluation_result: evalResult,
        status: "evaluated",
        xp_awarded: xpToAward,
        student_submission: code,
      })
      .eq("id", challengeId);

    // Update progress
    const { data: progress } = await supabase
      .from("progress_records")
      .select("*")
      .eq("student_id", user.id)
      .single();

    if (progress) {
      await supabase
        .from("progress_records")
        .update({
          coding_challenges_completed: progress.coding_challenges_completed + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", user.id);
    } else {
      await supabase.from("progress_records").insert({
        student_id: user.id,
        coding_challenges_completed: 1,
      });
    }

    // Update streak
    await updateStreak(user.id);

    // Check badges
    const newBadges = await checkAndAwardBadges(user.id);

    return NextResponse.json({
      result: evalResult,
      xp_earned: xpToAward,
      new_badges: newBadges,
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    // T054: on error, set status to pending_evaluation
    try {
      const supabase = await createClient();
      const body = await request.clone().json() as { challengeId?: string };
      if (body.challengeId) {
        await supabase
          .from("coding_challenges")
          .update({ status: "pending_evaluation" })
          .eq("id", body.challengeId);
      }
    } catch {
      // ignore
    }
    return NextResponse.json({ queued: true }, { status: 202 });
  }
}

"use server";

import { chatCompletion } from "@/lib/ai/stream";
import { requireUser } from "@/lib/auth/session";
import { createChallenge } from "@/lib/db/practice";
import { createClient } from "@/lib/supabase/server";

type GeneratedChallenge = {
  title: string;
  problem_statement: string;
  starter_code: string;
  expected_output_description: string;
};

export async function generateChallenge(
  language: string,
  topic: string,
  difficulty: "easy" | "medium" | "hard"
): Promise<{ challengeId: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Ensure students row exists (self-heal if auth trigger never fired)
  await supabase.from("students").upsert(
    { id: user.id, email: user.email ?? "", full_name: user.user_metadata?.full_name ?? null },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const prompt = `You are a coding challenge generator. Create a ${difficulty} difficulty coding challenge.

Language: ${language}
Topic: ${topic}
Difficulty: ${difficulty}

Return ONLY a valid JSON object with these exact fields:
- title: string (short challenge title)
- problem_statement: string (clear problem description, 2-4 paragraphs, include example inputs/outputs)
- starter_code: string (starter code template in ${language} with function signature and comments)
- expected_output_description: string (brief description of what correct output looks like)

Return ONLY the JSON, no markdown, no explanation, no code blocks.`;

  let challengeData: GeneratedChallenge;
  let usedFallback = false;

  try {
    const raw = await chatCompletion(prompt);
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    challengeData = JSON.parse(cleaned) as GeneratedChallenge;
    if (!challengeData.problem_statement || !challengeData.starter_code) {
      throw new Error("AI returned incomplete challenge");
    }
  } catch (err) {
    console.error("[generate-challenge] AI failed, using fallback:", err);
    usedFallback = true;
    challengeData = {
      title: `${topic} Challenge`,
      problem_statement: `Write a ${language} function that solves a ${difficulty} ${topic} problem.\n\nExample:\nInput: [1, 2, 3]\nOutput: [3, 2, 1]`,
      starter_code:
        language === "Python"
          ? `def solve(data):\n    # Your solution here\n    pass`
          : `function solve(data) {\n    // Your solution here\n}`,
      expected_output_description: "Return the correct result for the given input.",
    };
  }

  const challengeId = await createChallenge({
    student_id: user.id,
    language,
    topic,
    difficulty,
    problem_statement: challengeData.problem_statement,
    starter_code: challengeData.starter_code,
    used_fallback: usedFallback,
  });

  return { challengeId };
}

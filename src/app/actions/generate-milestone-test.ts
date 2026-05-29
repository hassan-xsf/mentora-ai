"use server";

import { chatCompletion } from "@/lib/openai/stream";
import { createClient } from "@/lib/supabase/server";
import type { MilestoneQuestion } from "@/types";

export async function generateMilestoneTest(
  testId: string,
  roadmapId: string,
  sectionTitle: string
): Promise<string> {
  const supabase = await createClient();

  // Get nodes for this test's section
  const { data: test } = await supabase
    .from("milestone_tests")
    .select("section_index")
    .eq("id", testId)
    .single();

  const sectionIndex = test?.section_index ?? 0;

  const { data: nodes } = await supabase
    .from("nodes")
    .select("title")
    .eq("roadmap_id", roadmapId)
    .eq("section_index", sectionIndex);

  const nodeTopics = (nodes ?? []).map((n) => n.title);

  const prompt = `You are an educational quiz generator. Create exactly 5 multiple-choice questions for a milestone test.

Section: "${sectionTitle}"
Topics covered: ${nodeTopics.join(", ")}

Return ONLY a valid JSON array with exactly 5 objects. Each object must have:
- id: string (unique id like "q1", "q2", etc.)
- question: string (the question text)
- type: "mcq"
- options: array of exactly 4 strings (answer choices)
- correct_answer: string (must exactly match one of the options)

Return ONLY the JSON array, no markdown, no explanation, no code blocks.`;

  let questions: MilestoneQuestion[] = [];

  try {
    const raw = await chatCompletion(prompt);
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as MilestoneQuestion[];
    questions = Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    // Fallback questions
    questions = nodeTopics.slice(0, 5).map((topic, i) => ({
      id: `q${i + 1}`,
      question: `Which of the following best describes ${topic}?`,
      type: "mcq" as const,
      options: [
        "A foundational concept in this field",
        "An advanced optimization technique",
        "A deprecated methodology",
        "An unrelated technology",
      ],
      correct_answer: "A foundational concept in this field",
    }));
  }

  await supabase
    .from("milestone_tests")
    .update({ questions: questions })
    .eq("id", testId);

  return testId;
}

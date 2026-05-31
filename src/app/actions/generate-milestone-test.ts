"use server";

import { chatCompletion } from "@/lib/ai/stream";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MilestoneQuestion } from "@/types";

function extractJSON(raw: string): string {
  // Strip markdown fences
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // Find the first [ or { and the matching last ] or }
  const firstBracket = Math.min(
    ...["[", "{"]
      .map((c) => cleaned.indexOf(c))
      .filter((i) => i !== -1)
  );
  const lastBracket = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));

  if (isFinite(firstBracket) && lastBracket > firstBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }
  return cleaned;
}

export async function generateMilestoneTest(
  testId: string,
  roadmapId: string,
  sectionTitle: string
): Promise<string> {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get nodes for this test's section
  const { data: test } = await supabase
    .from("milestone_tests")
    .select("section_index")
    .eq("id", testId)
    .single();

  const sectionIndex = test?.section_index ?? 0;

  const { data: nodes } = await supabase
    .from("nodes")
    .select("title, description")
    .eq("roadmap_id", roadmapId)
    .eq("section_index", sectionIndex);

  const nodeTopics = (nodes ?? []).map((n) => n.title);
  const topicsContext = (nodes ?? [])
    .map((n) => `- ${n.title}: ${n.description}`)
    .join("\n");

  const prompt = `You are an expert educational quiz designer. Create EXACTLY 5 multiple-choice questions for a milestone assessment.

SECTION: "${sectionTitle}"

TOPICS COVERED IN THIS SECTION:
${topicsContext || nodeTopics.join(", ")}

REQUIREMENTS:
- Generate EXACTLY 5 questions, no more, no less
- Each question MUST test understanding of one of the topics listed above
- Each question MUST have EXACTLY 4 options
- Exactly ONE option must be correct
- The correct_answer field MUST match one of the 4 options character-for-character
- Questions should be conceptual, not trivia — test true understanding
- Distractors (wrong answers) should be plausible, not obviously wrong
- Mix difficulty: 2 easy, 2 medium, 1 challenging
- Cover DIFFERENT topics across the 5 questions, not just one

OUTPUT FORMAT — return ONLY this JSON array, nothing else:
[
  {
    "id": "q1",
    "question": "Clear, specific question text ending with a question mark?",
    "type": "mcq",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct_answer": "Option A text"
  },
  ... 4 more objects with ids q2, q3, q4, q5
]

CRITICAL: Output ONLY the raw JSON array. No markdown fences. No explanations before or after. Start with [ and end with ].`;

  let questions: MilestoneQuestion[] = [];
  let usedFallback = false;

  try {
    const raw = await chatCompletion(prompt);
    const cleaned = extractJSON(raw);
    const parsed = JSON.parse(cleaned) as MilestoneQuestion[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("AI returned non-array or empty array");
    }

    questions = parsed
      .slice(0, 5)
      .filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4 && q.correct_answer)
      .map((q, i) => ({
        id: q.id || `q${i + 1}`,
        question: q.question,
        type: "mcq" as const,
        options: q.options,
        correct_answer: q.correct_answer,
      }));

    if (questions.length < 3) {
      throw new Error("AI returned too few valid questions");
    }
  } catch (err) {
    console.error("[generate-milestone-test] AI parse failed, using fallback:", err);
    usedFallback = true;
    // Fallback questions — only used if AI completely fails
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

  // Use admin client to bypass RLS for the write
  const { error: updateError } = await adminSupabase
    .from("milestone_tests")
    .update({ questions, used_fallback: usedFallback })
    .eq("id", testId);

  if (updateError) {
    console.error("[generate-milestone-test] Update failed:", updateError);
  }

  return testId;
}

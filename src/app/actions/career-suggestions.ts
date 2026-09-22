"use server";

import { chatCompletion } from "@/lib/ai/stream";
import { requireUser } from "@/lib/auth/session";
import { spendCredits } from "@/lib/credits/credits";
import type { AssessmentAnswer } from "@/types";

export type CareerSuggestionResult = {
  title: string;
  description: string;
  fit_score: number;
  demand_indicator: "High" | "Medium" | "Low";
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  why_good_fit: string;
};

export type CareerSuggestionsResponse = {
  suggestions: CareerSuggestionResult[];
  usedFallback: boolean;
};

export async function getCareerSuggestions(
  answers: AssessmentAnswer[]
): Promise<CareerSuggestionsResponse> {
  const user = await requireUser();
  await spendCredits(user.id, "career_suggestions");

  const answersText = answers
    .map(
      (a, i) =>
        `${i + 1}. ${a.question ?? a.question_id}\n   → ${
          Array.isArray(a.answer) ? a.answer.join("; ") : a.answer
        }`
    )
    .join("\n");

  const prompt = `You are an experienced tech career advisor. A student completed an assessment. Recommend exactly 5 careers they should seriously consider.

ASSESSMENT
${answersText}

HOW TO REASON
1. Read their stated skill level, weekly study hours and deadline as hard constraints. If they have under 10 hours a week and want to be employable in 6 months, do not recommend roles that realistically need years of maths or a research background.
2. Weigh what they said DRAINS them as heavily as what energises them. A role that hits one of their drains should score lower or be dropped.
3. Prefer specific, hireable roles ("Frontend Engineer (React)", "Analytics Engineer", "Site Reliability Engineer", "ML Engineer", "Security Analyst", "Technical Writer", "QA Automation Engineer", "Solutions Engineer") over vague umbrellas like "Software Engineer" or "IT Professional".
4. Spread the 5 across different kinds of work — do not return five flavours of the same job. Include at least one they probably have not considered but that genuinely fits their answers.
5. fit_score must be honest and spread out. Do not give everything 80-90. Only exceed 85 when the answers strongly converge; the weakest of the 5 should usually sit between 45 and 65.
6. Salary ranges: realistic entry-to-mid USD figures for that specific role in 2025, not top-of-market outliers.
7. demand_indicator reflects real current hiring volume for that role.

why_good_fit MUST quote or reference their actual answers (e.g. "you said long meetings drain you and you have 10-20 hours a week"). Generic praise that could apply to any student is a failure. Mention the honest downside or the main thing they would have to push through.

Return ONLY a valid JSON array of exactly 5 objects, ordered by fit_score descending. Fields, exactly:
- title: string
- description: string (2-3 sentences: what the job actually does day to day)
- fit_score: number (0-100 integer)
- demand_indicator: "High" | "Medium" | "Low"
- salary_min: number (USD, integer)
- salary_max: number (USD, integer)
- salary_currency: "USD"
- why_good_fit: string (2-3 sentences grounded in their specific answers, including the honest trade-off)

No markdown, no code blocks, no explanation. Start with [ and end with ].`;

  try {
    const raw = await chatCompletion(prompt);
    // Strip markdown code blocks if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as CareerSuggestionResult[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("AI returned non-array or empty array");
    }
    return { suggestions: parsed.slice(0, 5), usedFallback: false };
  } catch (err) {
    console.error("[career-suggestions] AI failed, using fallback:", err);
    return { usedFallback: true, suggestions: [
      {
        title: "Software Engineer",
        description: "Design and build software applications across web, mobile, and backend systems.",
        fit_score: 75,
        demand_indicator: "High",
        salary_min: 85000,
        salary_max: 160000,
        salary_currency: "USD",
        why_good_fit: "Software engineering is a versatile field that aligns with many technical interests and offers strong career growth.",
      },
      {
        title: "Full Stack Developer",
        description: "Build complete web applications from frontend to backend, handling databases and APIs.",
        fit_score: 70,
        demand_indicator: "High",
        salary_min: 80000,
        salary_max: 150000,
        salary_currency: "USD",
        why_good_fit: "Full stack development provides broad exposure to modern technologies and is in high demand across industries.",
      },
      {
        title: "Data Scientist",
        description: "Analyze large datasets to extract insights and build predictive models.",
        fit_score: 65,
        demand_indicator: "High",
        salary_min: 90000,
        salary_max: 155000,
        salary_currency: "USD",
        why_good_fit: "Data science combines programming with analytical skills to drive data-informed decisions.",
      },
      {
        title: "DevOps Engineer",
        description: "Automate deployments and manage cloud infrastructure for development teams.",
        fit_score: 60,
        demand_indicator: "High",
        salary_min: 95000,
        salary_max: 165000,
        salary_currency: "USD",
        why_good_fit: "DevOps is a growing field with excellent compensation and the opportunity to work across infrastructure and development.",
      },
      {
        title: "Product Manager",
        description: "Define product vision and coordinate cross-functional teams to build great products.",
        fit_score: 55,
        demand_indicator: "Medium",
        salary_min: 90000,
        salary_max: 160000,
        salary_currency: "USD",
        why_good_fit: "Product management bridges technical and business skills, making it ideal for those who enjoy strategy and collaboration.",
      },
    ] };
  }
}

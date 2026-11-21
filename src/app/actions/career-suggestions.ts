"use server";

import { redirect } from "next/navigation";
import { chatCompletion } from "@/lib/ai/stream";
import { parseJSONLoose } from "@/lib/ai/json";
import { reportFallback } from "@/lib/ai/telemetry";
import { requireUser } from "@/lib/auth/session";
import { spendCredits, refundCredits, isInsufficientCredits } from "@/lib/credits/credits";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAssessmentQuestions } from "@/lib/db/careers";
import { validateAnswers, type ValidAnswer } from "@/lib/assessment/validate";
import {
  computeProfile,
  rankedDimensions,
  DIMENSIONS,
  DIMENSION_LABELS,
  type SkillProfile,
} from "@/lib/assessment/profile";
import type { Json } from "@/types/database";

export type CareerSuggestionResult = {
  title: string;
  description: string;
  fit_score: number;
  demand_indicator: "High" | "Medium" | "Low";
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  why_good_fit: string;
  trade_off: string;
};

const FEATURE = "career_suggestions";

/**
 * Validate → charge once → AI once → save → redirect to the saved result.
 * Returns only on failure; success redirects.
 */
export async function submitAssessment(rawAnswers: unknown): Promise<{ error: string }> {
  const user = await requireUser();

  const checked = validateAnswers(await getAssessmentQuestions(), rawAnswers);
  if ("error" in checked) return checked;
  const profile = computeProfile(checked.answers);

  try {
    await spendCredits(user.id, FEATURE);
  } catch (err) {
    if (isInsufficientCredits(err)) return { error: err.message };
    throw err;
  }

  let suggestions: CareerSuggestionResult[];
  let usedFallback = false;
  try {
    const raw = await chatCompletion(buildPrompt(checked.answers, profile), { feature: FEATURE, studentId: user.id });
    suggestions = sanitize(parseJSONLoose<unknown>(raw));
    if (suggestions.length === 0) throw new Error("AI returned no usable suggestions");
  } catch (err) {
    console.error("[career-suggestions] AI failed, using fallback:", err);
    usedFallback = true;
    suggestions = FALLBACK;
    await refundCredits(user.id, FEATURE).catch(() => undefined);
    await reportFallback(FEATURE, err instanceof Error ? err.message : String(err));
  }

  const { data, error } = await createAdminClient()
    .from("assessments")
    .insert({
      student_id: user.id,
      answers: checked.answers as unknown as Json,
      skill_profile: profile as unknown as Json,
      suggestions: suggestions as unknown as Json,
      used_fallback: usedFallback,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[career-suggestions] save failed:", error);
    if (!usedFallback) await refundCredits(user.id, FEATURE).catch(() => undefined);
    return { error: "Could not save your results. You were not charged — please try again." };
  }

  redirect(`/assessment/results/${data.id}`);
}

function buildPrompt(answers: ValidAnswer[], profile: SkillProfile): string {
  const answersText = answers
    .map((a, i) => `${i + 1}. ${a.question}\n   → ${Array.isArray(a.answer) ? a.answer.join("; ") : a.answer}`)
    .join("\n");

  const ranked = rankedDimensions(profile);
  const profileText = DIMENSIONS.map((d) => `- ${DIMENSION_LABELS[d]}: ${profile.scores[d]}/100`).join("\n");

  return `You are an experienced tech career advisor. A student completed an assessment. Recommend exactly 5 careers they should seriously consider.

ASSESSMENT
${answersText}

SKILL PROFILE (computed deterministically from the answers above and shown to the student as a chart)
${profileText}
Strongest: ${DIMENSION_LABELS[ranked[0]]}, ${DIMENSION_LABELS[ranked[1]]}. Weakest: ${DIMENSION_LABELS[ranked[ranked.length - 1]]}.
Your recommendations must agree with this profile: centre them on the strongest dimensions, and do not recommend a role that mainly depends on a dimension under 30 unless you say why in the trade-off.

HOW TO REASON
1. Read their stated skill level, weekly study hours and deadline as hard constraints. If they have under 10 hours a week and want to be employable in 6 months, do not recommend roles that realistically need years of maths or a research background.
2. Weigh what they said DRAINS them as heavily as what energises them. A role that hits one of their drains should score lower or be dropped.
3. Prefer specific, hireable roles ("Frontend Engineer (React)", "Analytics Engineer", "Site Reliability Engineer", "ML Engineer", "Security Analyst", "Technical Writer", "QA Automation Engineer", "Solutions Engineer") over vague umbrellas like "Software Engineer" or "IT Professional".
4. Spread the 5 across different kinds of work — do not return five flavours of the same job. Include at least one they probably have not considered but that genuinely fits their answers.
5. fit_score must be honest and spread out. Do not give everything 80-90. Only exceed 85 when the answers strongly converge; the weakest of the 5 should usually sit between 45 and 65.
6. Salary ranges: realistic entry-to-mid USD figures for that specific role, not top-of-market outliers.
7. demand_indicator reflects real current hiring volume for that role.

why_good_fit MUST quote or reference their actual answers (e.g. "you said long meetings drain you and you have 10-20 hours a week"). Generic praise that could apply to any student is a failure.
trade_off is the honest downside for THIS student: the drain, constraint or weak dimension they would have to push through.

Return ONLY a valid JSON array of exactly 5 objects, ordered by fit_score descending. Fields, exactly:
- title: string
- description: string (2-3 sentences: what the job actually does day to day)
- fit_score: number (0-100 integer)
- demand_indicator: "High" | "Medium" | "Low"
- salary_min: number (USD, integer)
- salary_max: number (USD, integer)
- salary_currency: "USD"
- why_good_fit: string (2-3 sentences grounded in their specific answers)
- trade_off: string (1-2 sentences)

No markdown, no code blocks, no explanation. Start with [ and end with ].`;
}

/** Keep only well-formed items; the model output is untrusted. */
function sanitize(parsed: unknown): CareerSuggestionResult[] {
  if (!Array.isArray(parsed)) return [];
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0);
  return parsed
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c) => ({
      title: str(c.title),
      description: str(c.description),
      fit_score: Math.max(0, Math.min(100, int(c.fit_score))),
      demand_indicator: (["High", "Medium", "Low"].includes(c.demand_indicator as string)
        ? c.demand_indicator
        : "Medium") as CareerSuggestionResult["demand_indicator"],
      salary_min: Math.max(0, int(c.salary_min)),
      salary_max: Math.max(0, int(c.salary_max)),
      salary_currency: "USD",
      why_good_fit: str(c.why_good_fit),
      trade_off: str(c.trade_off),
    }))
    .filter((c) => c.title && c.description && c.why_good_fit)
    .sort((a, b) => b.fit_score - a.fit_score)
    .slice(0, 5);
}

const FALLBACK: CareerSuggestionResult[] = [
  {
    title: "Software Engineer",
    description: "Design and build software applications across web, mobile, and backend systems.",
    fit_score: 75,
    demand_indicator: "High",
    salary_min: 85000,
    salary_max: 160000,
    salary_currency: "USD",
    why_good_fit: "Software engineering is a versatile field that aligns with many technical interests and offers strong career growth.",
    trade_off: "Generic suggestion — not based on your answers.",
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
    trade_off: "Generic suggestion — not based on your answers.",
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
    trade_off: "Generic suggestion — not based on your answers.",
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
    trade_off: "Generic suggestion — not based on your answers.",
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
    trade_off: "Generic suggestion — not based on your answers.",
  },
];

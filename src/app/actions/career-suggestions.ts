"use server";

import { chatCompletion } from "@/lib/ai/stream";
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

export async function getCareerSuggestions(
  answers: AssessmentAnswer[]
): Promise<CareerSuggestionResult[]> {
  const answersText = answers
    .map((a, i) => `Q${i + 1}: ${Array.isArray(a.answer) ? a.answer.join(", ") : a.answer}`)
    .join("\n");

  const prompt = `You are a career counselor AI. Based on the following student assessment answers, suggest exactly 5 suitable tech careers.

Assessment answers:
${answersText}

Return ONLY a valid JSON array with exactly 5 objects. Each object must have these exact fields:
- title: string (career title)
- description: string (2-3 sentence description of the career)
- fit_score: number (0-100, how well this career fits the student)
- demand_indicator: string (must be exactly "High", "Medium", or "Low")
- salary_min: number (USD annual minimum salary, no decimals)
- salary_max: number (USD annual maximum salary, no decimals)
- salary_currency: string (must be "USD")
- why_good_fit: string (2-3 sentences explaining why this career fits the student based on their answers)

Return ONLY the JSON array, no markdown, no explanation, no code blocks.`;

  try {
    const raw = await chatCompletion(prompt);
    // Strip markdown code blocks if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as CareerSuggestionResult[];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    // Return fallback suggestions on parse error
    return [
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
    ];
  }
}

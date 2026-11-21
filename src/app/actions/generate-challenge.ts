"use server";

import { chatCompletion } from "@/lib/ai/stream";
import { parseJSONLoose } from "@/lib/ai/json";
import { reportFallback } from "@/lib/ai/telemetry";
import { requireUser } from "@/lib/auth/session";
import { createChallenge } from "@/lib/db/practice";
import { createAdminClient } from "@/lib/supabase/admin";
import { spendCredits, refundCredits, isInsufficientCredits } from "@/lib/credits/credits";
import { runTests, isRunnerLanguage, RunnerUnavailableError, LIMITS, type TestCase } from "@/lib/runner/piston";
import { keepAgreeingTests, markHidden, fixInvalidEscapes } from "@/lib/runner/grading";
import { fallbackChallenge, starterFor, challengePrompt } from "@/lib/runner/templates";

type GeneratedChallenge = {
  title: string;
  problem_statement: string;
  starter_code: string;
  reference_solution: string;
  tests: { input: string; output: string }[];
};

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const MAX_TESTS = 10;

function cleanTests(raw: unknown): TestCase[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is { input: string; output: string } =>
        !!t && typeof t.input === "string" && typeof t.output === "string" && t.input.length <= LIMITS.stdinChars
    )
    .slice(0, MAX_TESTS)
    .map((t) => ({ input: t.input, output: t.output }));
}

/**
 * Keep only tests the reference solution reproduces. Returns validated=false
 * (and the AI's tests unchanged) when the runner is down or fewer than 3 agree.
 */
async function validateTests(language: string, reference: string, tests: TestCase[]) {
  try {
    const ref = await runTests(language, reference, tests);
    const kept = keepAgreeingTests(tests, ref);
    if (kept.length >= 3) return { tests: kept, validated: true, disagreed: false };
    console.warn(`[generate-challenge] only ${kept.length}/${tests.length} tests agree with the reference`);
    return { tests, validated: false, disagreed: true };
  } catch (err) {
    if (!(err instanceof RunnerUnavailableError)) throw err;
    console.warn("[generate-challenge] runner unavailable, storing unvalidated tests:", err.message);
    return { tests, validated: false, disagreed: false };
  }
}

async function generateOnce(language: string, topic: string, difficulty: string, studentId: string) {
  const raw = await chatCompletion(challengePrompt(language, topic, difficulty), { feature: "generate_challenge", studentId });
  const parsed = parseJSONLoose<GeneratedChallenge>(fixInvalidEscapes(raw));
  const tests = cleanTests(parsed.tests);
  if (!parsed.problem_statement || !parsed.reference_solution || tests.length < 3) {
    throw new SyntaxError("AI returned an incomplete challenge"); // retried like malformed JSON
  }
  const checked = await validateTests(language, parsed.reference_solution, tests);

  let starter = parsed.starter_code ? String(parsed.starter_code) : starterFor(language);
  if (checked.validated) {
    // A starter that already passes every test gives the answer away.
    const s = await runTests(language, starter, checked.tests).catch(() => null);
    if (s?.every((r) => r.passed)) starter = starterFor(language);
  }

  return {
    validated: checked.validated,
    disagreed: checked.disagreed,
    challenge: {
      title: String(parsed.title || `${topic} Challenge`).slice(0, 120),
      problem_statement: String(parsed.problem_statement),
      starter_code: starter,
      reference_solution: String(parsed.reference_solution),
      tests: markHidden(checked.tests),
    },
  };
}

export async function generateChallenge(
  language: string,
  topic: string,
  difficulty: "easy" | "medium" | "hard"
): Promise<{ challengeId: string } | { error: string }> {
  const user = await requireUser();
  if (!isRunnerLanguage(language)) return { error: `${language} is not supported yet.` };
  if (!DIFFICULTIES.includes(difficulty)) return { error: "Invalid difficulty" };
  topic = String(topic).slice(0, 60);

  // Ensure students row exists (self-heal if auth trigger never fired)
  await createAdminClient().from("students").upsert(
    { id: user.id, email: user.email ?? "", full_name: user.user_metadata?.full_name ?? null },
    { onConflict: "id", ignoreDuplicates: true }
  );

  try {
    await spendCredits(user.id, "generate_challenge");
  } catch (err) {
    // Returned, not thrown: production builds hide thrown server-action messages.
    if (isInsufficientCredits(err)) return { error: err.message };
    throw err;
  }

  let challenge: Omit<GeneratedChallenge, "reference_solution" | "tests"> & {
    reference_solution: string | null;
    tests: TestCase[];
  };
  let usedFallback = false;
  let validated = false;

  try {
    // Malformed/incomplete JSON (e.g. unescaped quotes in code) is common enough to retry; AI outages fall back.
    let g = await generateOnce(language, topic, difficulty, user.id).catch((err) => {
      if (err instanceof SyntaxError) return null;
      throw err;
    });
    // Unparseable, or the reference contradicted the AI's own tests: one fresh attempt.
    if (!g || g.disagreed) {
      const again = await generateOnce(language, topic, difficulty, user.id).catch((err) => {
        if (!g) throw err;
        return null;
      });
      if (again && (!g || again.validated)) g = again;
    }
    if (!g) throw new Error("AI challenge generation failed");
    validated = g.validated;
    challenge = g.challenge;
  } catch (err) {
    console.error("[generate-challenge] AI failed, using fallback:", err);
    usedFallback = true;
    validated = true; // hand-written tests
    const fb = fallbackChallenge(language, topic);
    challenge = { ...fb, reference_solution: null, tests: markHidden(fb.tests) };
    await refundCredits(user.id, "generate_challenge");
    await reportFallback("generate_challenge", err instanceof Error ? err.message : String(err));
  }

  try {
    const challengeId = await createChallenge({
      student_id: user.id,
      language,
      topic,
      difficulty,
      ...challenge,
      used_fallback: usedFallback,
      validated,
    });
    return { challengeId };
  } catch (err) {
    if (!usedFallback) await refundCredits(user.id, "generate_challenge");
    throw err;
  }
}

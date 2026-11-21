/**
 * Self-check for assessment scoring + answer validation.
 * Run: npx tsx src/lib/assessment/profile.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeProfile, matchCareer, careerDimensions, OPTION_WEIGHTS, DIMENSIONS } from "./profile";
import { validateAnswers, type BankQuestion } from "./validate";

// Weights cover exactly the options seeded in migration 009 (catches text drift).
{
  const sql = readFileSync(join(process.cwd(), "supabase/migrations/009_assessments.sql"), "utf8");
  const seeded = new Map<string, string[]>();
  for (const m of sql.matchAll(/\('([a-z_]+)', (?:true|false), \d+, '[a-z_]+', '[^']*',\s*'(\[[^']*\])'\)/g)) {
    seeded.set(m[1], JSON.parse(m[2]) as string[]);
  }
  assert.equal(seeded.size, 18, "expected 18 seeded questions");
  assert.deepEqual([...seeded.keys()].sort(), Object.keys(OPTION_WEIGHTS).sort());
  for (const [slug, options] of seeded) {
    assert.deepEqual(Object.keys(OPTION_WEIGHTS[slug]).sort(), [...options].sort(), `options drift: ${slug}`);
  }
}

// Deterministic: same answers, same profile.
const dataPerson = [
  { slug: "math_comfort", question: "Maths?", answer: "Comfortable with statistics and probability" },
  { slug: "energy_source", question: "Energy?", answer: ["Digging through a messy dataset for the real story"] },
  { slug: "drain_source", question: "Drain?", answer: ["Long meetings and stakeholder alignment", "Pixel-level visual polish"] },
  { slug: "time_commitment", question: "Hours?", answer: "10-20 hours, this is a serious focus" },
  { slug: "horizon", question: "When?", answer: "About a year" },
];
const p = computeProfile(dataPerson);
assert.deepEqual(p, computeProfile(dataPerson));

// Scores in range, data/analytical lead, drained dimensions bottom out at 0.
for (const d of DIMENSIONS) assert.ok(p.scores[d] >= 0 && p.scores[d] <= 100);
assert.equal(p.scores.data, 100); // 2+3 of a possible 2+3
assert.ok(p.scores.analytical > p.scores.building);
assert.equal(p.scores.people, 0);
assert.equal(p.scores.design, 0);
assert.equal(p.constraints.hours_per_week, "10-20 hours, this is a serious focus");
assert.equal(p.constraints.timeline, "About a year");
assert.equal(p.constraints.experience, null);

// Evidence cites the actual answer, strongest first.
assert.equal(p.evidence.data[0].answer, "Digging through a messy dataset for the real story");
assert.ok(p.evidence.people.some((e) => e.weight < 0));

// Multi-choice can't exceed the best single option for a dimension.
{
  const many = computeProfile([
    { slug: "tools_touched", question: "Tools?", answer: ["Git and GitHub", "HTML and CSS", "Python", "JavaScript or TypeScript"] },
  ]);
  assert.equal(many.scores.building, 100);
}

// Unknown slugs/options are ignored, empty input is all zeros.
assert.deepEqual(computeProfile([{ slug: "nope", question: "?", answer: "x" }]).scores, computeProfile([]).scores);

// Career matching.
assert.deepEqual(careerDimensions("Data Analyst"), ["analytical", "data"]);
assert.deepEqual(careerDimensions("Site Reliability Engineer"), ["building", "infrastructure"]);
assert.deepEqual(matchCareer("Data Analyst", p).matched, ["analytical", "data"]);
assert.deepEqual(matchCareer("UX Designer", p).weaker, ["design"]);

// Validation.
const bank: BankQuestion[] = [
  { id: "q1", slug: "horizon", question: "When?", type: "single_choice", options: ["About a year", "2+ years"], is_core: true },
  { id: "q2", slug: "domain_pull", question: "Domains?", type: "multi_choice", options: ["Education", "Health"], is_core: false },
  { id: "q3", slug: "writing", question: "Writing?", type: "scale", options: ["Neutral", "I avoid it"], is_core: false },
];
{
  const ok = validateAnswers(bank, { q1: "About a year", q2: ["Education"] });
  assert.ok("answers" in ok);
  assert.equal(ok.answers.length, 2);
  assert.equal(ok.answers[0].slug, "horizon");
}
assert.ok("error" in validateAnswers(bank, { q2: ["Education"] }), "missing core");
assert.ok("error" in validateAnswers(bank, { q1: "Tomorrow" }), "value not allowed");
assert.ok("error" in validateAnswers(bank, { q1: "About a year", qX: "x" }), "unknown id");
assert.ok("error" in validateAnswers(bank, { q1: "About a year", q2: [] }), "empty multi");
assert.ok("error" in validateAnswers(bank, { q1: "About a year", q2: ["Education", "Education"] }), "duplicate multi");
assert.ok("error" in validateAnswers(bank, { q1: ["About a year"] }), "array for single");
assert.ok("error" in validateAnswers(bank, { q1: "About a year", q3: 3 }), "non-string scale");
assert.ok("error" in validateAnswers(bank, null));
assert.ok("error" in validateAnswers(bank, []));

console.log("profile.test.ts: all assertions passed");

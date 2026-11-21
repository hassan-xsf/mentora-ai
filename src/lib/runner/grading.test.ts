/**
 * Self-check for output comparison, grading and redaction.
 * Run: npx tsx src/lib/runner/grading.test.ts
 */
import assert from "node:assert/strict";
import { normalizeOutput, outputsMatch, type TestResult, type TestCase } from "./piston";
import { summarize, toClientResults, keepAgreeingTests, markHidden, earnsXP, fixInvalidEscapes } from "./grading";

// Trailing whitespace / newlines and CRLF don't matter...
assert.ok(outputsMatch("3\n", "3"));
assert.ok(outputsMatch("1 2 3 \r\n4\r\n\r\n", "1 2 3\n4"));
assert.ok(outputsMatch("a\t\n", "a"));
// ...but content, leading whitespace and inner blank lines do.
assert.ok(!outputsMatch("3", "4"));
assert.ok(!outputsMatch(" 3", "3"));
assert.ok(!outputsMatch("1\n\n2", "1\n2"));
assert.ok(!outputsMatch("", "0"));
assert.equal(normalizeOutput("x  \ny \n\n"), "x\ny");

const mk = (test: TestCase, passed: boolean, extra: Partial<TestResult> = {}): TestResult => ({
  status: passed ? "passed" : "wrong_answer",
  stdout: passed ? test.output : "nope",
  stderr: "",
  compileOutput: null,
  timeMs: 10,
  memoryKb: 1000,
  passed,
  test,
  ...extra,
});

const tests: TestCase[] = [
  { input: "1", output: "1" },
  { input: "2", output: "4" },
  { input: "3", output: "9", hidden: true },
  { input: "4", output: "16", hidden: true },
];

// Correctness = % passed; pass = all passed.
{
  const s = summarize([mk(tests[0], true), mk(tests[1], true), mk(tests[2], false), mk(tests[3], true)]);
  assert.equal(s.testsPassed, 3);
  assert.equal(s.correctness, 75);
  assert.equal(s.passed, false);
  assert.ok(summarize(tests.map((t) => mk(t, true))).passed);
  assert.equal(summarize([]).passed, false);
}

// Hidden tests never leak input/expected/actual/stderr to the client.
{
  const client = toClientResults([mk(tests[0], false, { stderr: "boom" }), mk(tests[2], false, { stderr: "3" })]);
  assert.equal(client[0].input, "1");
  assert.equal(client[0].actual, "nope");
  assert.equal(client[0].stderr, "boom");
  const hidden = client[1];
  assert.equal(hidden.hidden, true);
  for (const k of ["input", "expected", "actual", "stderr"] as const) assert.equal(hidden[k], undefined);
  assert.ok(!JSON.stringify(hidden).includes('"9"'));
}

// Validation drops tests the reference solution disagrees with.
{
  const kept = keepAgreeingTests(tests, [mk(tests[0], true), mk(tests[1], false), mk(tests[2], true), mk(tests[3], true)]);
  assert.deepEqual(kept.map((t) => t.input), ["1", "3", "4"]);
}

// 2–3 visible examples.
assert.equal(markHidden(tests).filter((t) => !t.hidden).length, 2);
assert.equal(markHidden([...tests, ...tests]).filter((t) => !t.hidden).length, 3);

// XP only for a clean full pass; the DB claim on first_passed_at makes it once.
{
  const pass = summarize(tests.map((t) => mk(t, true)));
  const fail = summarize([mk(tests[0], true), mk(tests[1], false)]);
  assert.equal(earnsXP(pass, false), true);
  assert.equal(earnsXP(pass, true), false);
  assert.equal(earnsXP(fail, false), false);
}

console.log("runner grading self-check passed");

// Invalid JSON escapes from model-written code are kept literally; valid ones untouched.
{
  const fixed = fixInvalidEscapes(String.raw`{"a":"pair \u{(i,j)} and \d+ ok \\d \n é \"q\""}`);
  const parsed = JSON.parse(fixed) as { a: string };
  assert.equal(parsed.a, String.raw`pair \u{(i,j)} and \d+ ok \d` + ' \n é "q"');
  const valid = String.raw`{"a":"x\ny \\u{ A"}`;
  assert.equal(fixInvalidEscapes(valid), valid);
  // Raw newlines/tabs inside strings are escaped; whitespace between tokens is not.
  const pretty = '{\n  "code": "fn main() {\n\tprintln!(\\"hi\\");\n}"\n}';
  assert.equal((JSON.parse(fixInvalidEscapes(pretty)) as { code: string }).code, 'fn main() {\n\tprintln!("hi");\n}');
  assert.equal(fixInvalidEscapes('{\n "a": [1, 2]\n}'), '{\n "a": [1, 2]\n}');
}
console.log("escape repair self-check passed");

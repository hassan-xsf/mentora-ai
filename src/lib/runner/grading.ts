import type { TestCase, TestResult, TestStatus } from "./piston";

/** What the browser may see about one test. Hidden tests never carry input/expected/actual. */
export type ClientTestResult = {
  index: number;
  hidden: boolean;
  passed: boolean;
  status: TestStatus;
  input?: string;
  expected?: string;
  actual?: string;
  stderr?: string;
  timeMs: number | null;
  memoryKb: number | null;
};

export type GradeSummary = {
  passed: boolean;
  testsPassed: number;
  testsTotal: number;
  /** % of tests passed — the only correctness signal. */
  correctness: number;
  compileError: string | null;
  runtimeMs: number | null;
  memoryKb: number | null;
};

const maxOf = (xs: (number | null)[]) => {
  const n = xs.filter((x): x is number => x != null);
  return n.length ? Math.max(...n) : null;
};

export function summarize(results: TestResult[]): GradeSummary {
  const testsPassed = results.filter((r) => r.passed).length;
  const testsTotal = results.length;
  return {
    passed: testsTotal > 0 && testsPassed === testsTotal,
    testsPassed,
    testsTotal,
    correctness: testsTotal ? Math.round((testsPassed / testsTotal) * 100) : 0,
    compileError: results.find((r) => r.compileOutput)?.compileOutput ?? null,
    runtimeMs: maxOf(results.map((r) => r.timeMs)),
    memoryKb: maxOf(results.map((r) => r.memoryKb)),
  };
}

export function toClientResults(results: TestResult[]): ClientTestResult[] {
  return results.map((r, index) => {
    const base = {
      index,
      hidden: !!r.test.hidden,
      passed: r.passed,
      status: r.status,
      timeMs: r.timeMs,
      memoryKb: r.memoryKb,
    };
    // stdout/stderr of a hidden test would let a program echo the hidden input back.
    if (r.test.hidden) return base;
    return { ...base, input: r.test.input, expected: r.test.output, actual: r.stdout, stderr: r.stderr || undefined };
  });
}

/**
 * Generation-time validation: keep only the tests the reference solution
 * reproduces. Fewer than 3 survivors means the AI's tests can't be trusted.
 */
export function keepAgreeingTests(tests: TestCase[], refResults: TestResult[]): TestCase[] {
  return tests.filter((_, i) => refResults[i]?.passed);
}

/** 2–3 visible examples, the rest hidden. */
export function markHidden(tests: TestCase[]): TestCase[] {
  const visible = tests.length >= 6 ? 3 : 2;
  return tests.map((t, i) => ({ input: t.input, output: t.output, hidden: i >= visible }));
}

/**
 * XP is only earned by a full pass that was graded without any fallback.
 * The once-per-challenge guarantee comes from the caller atomically claiming
 * coding_challenges.first_passed_at (update ... where first_passed_at is null).
 */
export function earnsXP(summary: GradeSummary, usedFallback: boolean): boolean {
  return summary.passed && !usedFallback;
}

/**
 * Models writing code inside JSON strings emit invalid escapes (`\u{`, `\d`) and
 * raw newlines/tabs. Inside strings only: keep bad escapes as literal backslashes
 * and escape control characters. Valid JSON comes back unchanged.
 */
export function fixInvalidEscapes(raw: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (!inString) {
      if (c === '"') inString = true;
      out += c;
    } else if (c === "\\") {
      const rest = raw.slice(i + 1, i + 6);
      if (/^["\\/bfnrt]/.test(rest)) {
        out += c + rest[0];
        i++;
      } else if (/^u[0-9a-fA-F]{4}/.test(rest)) {
        out += c + rest;
        i += 5;
      } else {
        out += "\\\\";
      }
    } else if (c === '"') {
      inString = false;
      out += c;
    } else if (c < " ") {
      out += c === "\n" ? "\\n" : c === "\r" ? "\\r" : c === "\t" ? "\\t" : `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`;
    } else {
      out += c;
    }
  }
  return out;
}

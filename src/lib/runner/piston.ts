// Client for a Piston-compatible code runner (https://github.com/engineer-man/piston).
// CODE_RUNNER_URL is the API base that `/execute` hangs off, e.g.
//   http://localhost:2000/api/v2          (self-hosted, see docs/CODE_RUNNER.md)
//   https://emkc.org/api/v2/piston        (public API, whitelist-only since Feb 2026)
// CODE_RUNNER_TOKEN, when set, is sent as `Authorization: Bearer <token>`.

/** Editor language label (lowercased) → Piston language + source file name. */
const LANGUAGES: Record<string, { piston: string; file: string }> = {
  python: { piston: "python", file: "main.py" },
  javascript: { piston: "javascript", file: "main.js" },
  // Deno, not Piston's tsc package: that one compiles to ES5 without Node typings,
  // so Set/Map iteration and require() fail to compile.
  typescript: { piston: "deno", file: "main.ts" },
  java: { piston: "java", file: "Main.java" },
  "c++": { piston: "c++", file: "main.cpp" },
  go: { piston: "go", file: "main.go" },
  rust: { piston: "rust", file: "main.rs" },
};

export const LIMITS = {
  compileTimeoutMs: 10_000,
  runTimeoutMs: 3_000,
  memoryBytes: 256 * 1024 * 1024,
  /** Max chars kept per stream; anything longer counts as wrong and is truncated. */
  outputChars: 8_000,
  codeChars: 50_000,
  stdinChars: 100_000,
};

const REQUEST_TIMEOUT_MS = 30_000;
const CONCURRENCY = 3;

export class RunnerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunnerUnavailableError";
  }
}

export function isRunnerLanguage(language: string): boolean {
  return language.toLowerCase() in LANGUAGES;
}

type PistonStage = {
  stdout?: string;
  stderr?: string;
  code?: number | null;
  signal?: string | null;
  message?: string | null;
  status?: string | null;
  cpu_time?: number;
  wall_time?: number;
  memory?: number;
};

export type TestStatus =
  | "passed"
  | "wrong_answer"
  | "runtime_error"
  | "timeout"
  | "memory_limit"
  | "output_limit"
  | "compile_error";

export type ExecResult = {
  status: TestStatus | "ok";
  stdout: string;
  stderr: string;
  compileOutput: string | null;
  timeMs: number | null;
  memoryKb: number | null;
};

export type TestCase = { input: string; output: string; hidden?: boolean };

export type TestResult = ExecResult & { status: TestStatus; passed: boolean; test: TestCase };

/** Trailing whitespace on each line and trailing blank lines don't matter; CRLF = LF. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

const cap = (s: string | undefined) => (s ?? "").slice(0, LIMITS.outputChars);

function stageStatus(s: PistonStage): ExecResult["status"] {
  // Piston status codes: TO timeout, OL/EL output limit, SG signal, RE runtime error, XX internal
  if (s.status === "TO") return "timeout";
  if (s.status === "OL" || s.status === "EL") return "output_limit";
  if (s.status === "XX") throw new RunnerUnavailableError(s.message ?? "runner internal error");
  // The cgroup OOM killer shows up as a kill (137 via the run wrapper) at ~the memory cap.
  if ((s.code === 137 || s.signal === "SIGKILL") && (s.memory ?? 0) >= LIMITS.memoryBytes * 0.9) return "memory_limit";
  if (s.status || s.signal || (s.code ?? 0) !== 0) return "runtime_error";
  return "ok";
}

/** Run one program on one stdin. Throws RunnerUnavailableError when the runner can't be used. */
export async function execute(language: string, code: string, stdin: string): Promise<ExecResult> {
  const lang = LANGUAGES[language.toLowerCase()];
  if (!lang) throw new RunnerUnavailableError(`Unsupported language: ${language}`);
  const base = process.env.CODE_RUNNER_URL?.replace(/\/+$/, "");
  if (!base) throw new RunnerUnavailableError("CODE_RUNNER_URL is not set");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.CODE_RUNNER_TOKEN) headers.Authorization = `Bearer ${process.env.CODE_RUNNER_TOKEN}`;

  let res: Response;
  try {
    res = await fetch(`${base}/execute`, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        language: lang.piston,
        version: "*",
        files: [{ name: lang.file, content: code }],
        stdin,
        compile_timeout: LIMITS.compileTimeoutMs,
        run_timeout: LIMITS.runTimeoutMs,
        run_memory_limit: LIMITS.memoryBytes,
      }),
    });
  } catch (err) {
    throw new RunnerUnavailableError(`runner unreachable: ${err instanceof Error ? err.message : err}`);
  }

  const body = (await res.json().catch(() => null)) as
    | { run?: PistonStage; compile?: PistonStage; message?: string }
    | null;
  if (!res.ok || !body?.run) {
    throw new RunnerUnavailableError(`runner HTTP ${res.status}: ${body?.message ?? "bad response"}`);
  }

  const compile = body.compile;
  if (compile && stageStatus(compile) !== "ok") {
    return {
      status: "compile_error",
      stdout: "",
      stderr: "",
      compileOutput: cap((compile.stderr || compile.stdout || compile.message) ?? "Compilation failed"),
      timeMs: null,
      memoryKb: null,
    };
  }

  const run = body.run;
  return {
    status: stageStatus(run),
    stdout: cap(run.stdout),
    stderr: cap(run.stderr || (run.message ?? "")),
    compileOutput: null,
    timeMs: run.wall_time ?? run.cpu_time ?? null,
    memoryKb: run.memory != null ? Math.round(run.memory / 1024) : null,
  };
}

function toTestResult(test: TestCase, r: ExecResult): TestResult {
  let status: TestStatus = r.status === "ok" ? "passed" : r.status;
  // A stdout that hit our cap can't be trusted as a full answer.
  if (status === "passed" && r.stdout.length >= LIMITS.outputChars) status = "output_limit";
  else if (status === "passed" && !outputsMatch(r.stdout, test.output)) status = "wrong_answer";
  return { ...r, test, status, passed: status === "passed" };
}

/**
 * Run `code` against every test. The first test runs alone so a compile error
 * costs one request instead of N; the rest run CONCURRENCY at a time.
 */
export async function runTests(language: string, code: string, tests: TestCase[]): Promise<TestResult[]> {
  if (tests.length === 0) return [];
  const first = await execute(language, code, tests[0].input);
  if (first.status === "compile_error") {
    return tests.map((t) => toTestResult(t, first));
  }
  const results: TestResult[] = [toTestResult(tests[0], first)];
  for (let i = 1; i < tests.length; i += CONCURRENCY) {
    const batch = tests.slice(i, i + CONCURRENCY);
    const out = await Promise.all(batch.map((t) => execute(language, code, t.input)));
    out.forEach((r, j) => results.push(toTestResult(batch[j], r)));
  }
  return results;
}

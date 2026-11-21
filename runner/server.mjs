// Piston-compatible code runner (POST /api/v2/execute) for hosts where the Piston image can't run
// (it's x86-only; the Oracle VM is ARM). Every compile/run stage is a fresh locked-down container.
// Node stdlib only. See docs/CODE_RUNNER.md.
import http from "node:http";
import { spawn, execFile } from "node:child_process";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.env.PORT ?? 2000);
const TOKEN = process.env.RUNNER_TOKEN ?? "";
const IMAGE = process.env.RUNNER_IMAGE ?? "mentora-runner:1";
const ROOT = process.env.RUNNER_DIR ?? "/var/lib/mentora-runner";
const MAX_JOBS = Number(process.env.MAX_JOBS ?? 4); // 1 vCPU: queue instead of running dozens at once
const OUTPUT_MAX = 65_536;
const CODE_MAX = 64_000;
const STDIN_MAX = 200_000;
const MB = 1024 * 1024;

if (!TOKEN) throw new Error("RUNNER_TOKEN is required");

const JVM = ["-Xss32m", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1"];
const LANGS = {
  python: { version: "3.12", file: "main.py", run: ["python3", "/box/main.py"] },
  javascript: { version: "20", file: "main.js", run: ["node", "/box/main.js"] },
  deno: { version: "1.43", file: "main.ts", run: ["deno", "run", "--quiet", "--no-prompt", "/box/main.ts"] },
  java: {
    version: "21",
    file: "Main.java",
    compile: ["javac", "-J-Xmx256m", "-J-XX:+UseSerialGC", "-d", "/out", "/box/Main.java"],
    run: ["java", "-Xmx160m", ...JVM, "-cp", "/out", "Main"],
  },
  "c++": { version: "13", file: "main.cpp", compile: ["g++", "-O2", "-std=c++17", "-o", "/out/main", "/box/main.cpp"], run: ["/out/main"] },
  go: { version: "1.22", file: "main.go", compile: ["go", "build", "-o", "/out/main", "/box/main.go"], run: ["/out/main"] },
  rust: { version: "1.78", file: "main.rs", compile: ["rustc", "-O", "-o", "/out/main", "/box/main.rs"], run: ["/out/main"] },
};
const SIGNALS = { 134: "SIGABRT", 136: "SIGFPE", 137: "SIGKILL", 139: "SIGSEGV" };

// Semaphore: a finished job hands its slot straight to the next waiter.
let active = 0;
const waiting = [];
async function slot(fn) {
  if (active >= MAX_JOBS) await new Promise((r) => waiting.push(r));
  else active++;
  try {
    return await fn();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}

const docker = (args) => new Promise((r) => execFile("docker", args, (err, out) => r(err ? "" : out.trim())));

/** One container run. Returns a Piston stage: stdout, stderr, code, signal, status (TO/OL/XX), wall_time, memory. */
function stage({ cmd, mounts, stdin = "", timeoutMs, memBytes }) {
  return slot(
    () =>
      new Promise((resolve) => {
        const name = `mr-${randomUUID()}`;
        const mem = String(memBytes);
        const args = [
          "run", "--name", name, "-i", "--init", "--network", "none", "--read-only",
          "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--pids-limit", "64", "--cpus", "1",
          "--memory", mem, "--memory-swap", mem, "--user", "65534:65534",
          "--tmpfs", "/tmp:rw,exec,nosuid,size=64m", "-w", "/tmp",
          ...mounts.flatMap((m) => ["-v", m]),
          IMAGE, "timeout", "-s", "KILL", String(Math.ceil(timeoutMs / 1000)), ...cmd,
        ];
        const started = Date.now();
        const child = spawn("docker", args);
        let stdout = "";
        let stderr = "";
        let status = null;
        const kill = () => docker(["kill", name]);
        // Backstop for a stuck container start; the in-container `timeout` is the real limit.
        const guard = setTimeout(() => {
          status ??= "TO";
          kill();
        }, timeoutMs + 15_000);
        const take = (isOut) => (chunk) => {
          if (isOut) stdout += chunk;
          else stderr += chunk;
          if (stdout.length + stderr.length > OUTPUT_MAX && !status) {
            status = "OL";
            kill();
          }
        };
        child.stdout.setEncoding("utf8").on("data", take(true));
        child.stderr.setEncoding("utf8").on("data", take(false));
        child.stdin.on("error", () => {}); // program exited without reading stdin
        child.stdin.end(stdin);
        child.on("close", async (code) => {
          clearTimeout(guard);
          const oom = (await docker(["inspect", "-f", "{{.State.OOMKilled}}", name])) === "true";
          docker(["rm", "-f", name]);
          let message = null;
          if (code === 125) {
            status = "XX"; // docker itself failed
            message = stderr.slice(0, 500);
            stderr = "";
          } else if (code === 137 && !status && !oom) status = "TO";
          stdout = stdout.slice(0, OUTPUT_MAX);
          stderr = stderr.slice(0, OUTPUT_MAX);
          resolve({
            stdout, stderr, output: stdout + stderr, code, signal: SIGNALS[code] ?? null, status, message,
            wall_time: Date.now() - started, memory: oom ? memBytes : null,
          });
        });
      }),
  );
}

// Compiled output is cached by source hash so N tests compile once.
const builds = new Map();
function compile(language, code, jobDir, timeoutMs) {
  const key = createHash("sha256").update(`${language}\0${code}`).digest("hex");
  if (!builds.has(key)) {
    const out = path.join(ROOT, "build", key);
    const p = (async () => {
      await fs.rm(out, { recursive: true, force: true });
      await fs.mkdir(out, { recursive: true });
      await fs.chmod(out, 0o777);
      const mounts = [`${jobDir}:/box:ro`, `${out}:/out`];
      if (language === "go") mounts.push(`${path.join(ROOT, "gocache")}:/gocache`);
      const r = await stage({ cmd: LANGS[language].compile, mounts, timeoutMs, memBytes: 512 * MB });
      return { r, out };
    })();
    builds.set(key, p);
    // Don't cache failures caused by load (timeout / docker error); compile errors are deterministic.
    p.then(({ r }) => r.status && builds.delete(key), () => builds.delete(key));
    if (builds.size > 300) {
      const [oldest] = builds.keys();
      builds.delete(oldest);
      fs.rm(path.join(ROOT, "build", oldest), { recursive: true, force: true }).catch(() => {});
    }
  }
  return builds.get(key);
}

const clamp = (v, dflt, min, max) => (typeof v === "number" && v > 0 ? Math.min(Math.max(v, min), max) : dflt);
const EMPTY_RUN = { stdout: "", stderr: "", output: "", code: null, signal: null, status: null };

async function execute(body) {
  const lang = LANGS[body?.language];
  if (!lang) return [400, { message: `${body?.language} runtime is unknown` }];
  const code = body.files?.[0]?.content;
  if (typeof code !== "string" || code.length > CODE_MAX) return [400, { message: "files[0].content missing or too large" }];
  const stdin = typeof body.stdin === "string" ? body.stdin : "";
  if (stdin.length > STDIN_MAX) return [400, { message: "stdin too large" }];
  const runTimeout = clamp(body.run_timeout, 3000, 500, 5000);
  const compileTimeout = clamp(body.compile_timeout, 10_000, 1000, 15_000);
  const runMem = clamp(body.run_memory_limit, 256 * MB, 64 * MB, 512 * MB);

  const jobDir = path.join(ROOT, "jobs", randomUUID());
  await fs.mkdir(jobDir, { recursive: true });
  await fs.chmod(jobDir, 0o755);
  await fs.writeFile(path.join(jobDir, lang.file), code, { mode: 0o644 });
  try {
    const res = { language: body.language, version: lang.version };
    const mounts = [`${jobDir}:/box:ro`];
    if (lang.compile) {
      const { r, out } = await compile(body.language, code, jobDir, compileTimeout);
      res.compile = r;
      if (r.status || r.code !== 0) return [200, { ...res, run: EMPTY_RUN }];
      mounts.push(`${out}:/out:ro`);
    }
    res.run = await stage({ cmd: lang.run, mounts, stdin, timeoutMs: runTimeout, memBytes: runMem });
    return [200, res];
  } finally {
    fs.rm(jobDir, { recursive: true, force: true }).catch(() => {});
  }
}

function authorized(req) {
  const got = Buffer.from(req.headers.authorization ?? "");
  const want = Buffer.from(`Bearer ${TOKEN}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

await fs.rm(path.join(ROOT, "build"), { recursive: true, force: true });
for (const d of ["jobs", "build", "gocache"]) await fs.mkdir(path.join(ROOT, d), { recursive: true });
await fs.chmod(path.join(ROOT, "gocache"), 0o777);

http
  .createServer(async (req, res) => {
    const send = (status, obj) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    try {
      if (!authorized(req)) return send(401, { message: "unauthorized" });
      if (req.method === "GET" && req.url === "/api/v2/runtimes") {
        return send(200, Object.entries(LANGS).map(([language, l]) => ({ language, version: l.version, aliases: [] })));
      }
      if (req.method !== "POST" || req.url !== "/api/v2/execute") return send(404, { message: "not found" });
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 1_000_000) return send(413, { message: "request too large" });
      }
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return send(400, { message: "invalid JSON" });
      }
      const [status, out] = await execute(body);
      send(status, out);
    } catch (err) {
      console.error(err);
      send(500, { message: "internal error" });
    }
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mentora-runner on 127.0.0.1:${PORT}, ${MAX_JOBS} jobs`));

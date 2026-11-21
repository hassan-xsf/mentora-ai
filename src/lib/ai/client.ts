// Thin wrapper around the Mentora AI service.
// Endpoint accepts a `query` parameter and returns `{ response: string }`.
import { logAICall } from "./telemetry";

type AIResponse = {
  response?: string;
  result?: string;
  text?: string;
  output?: string;
};

export type AIQueryOptions = {
  /** Telemetry label, e.g. "generate_roadmap". Defaults to "unknown". */
  feature?: string;
  /** Logged with the call when known; never sent to the model. */
  studentId?: string;
  /** Per-attempt timeout; defaults to AI_TIMEOUT_MS or 60s. */
  timeoutMs?: number;
};

function getConfig() {
  const url = process.env.AI_API_URL;
  const token = process.env.AI_SECRET_TOKEN;
  if (!url) throw new Error("AI_API_URL is not set");
  if (!token) throw new Error("AI_SECRET_TOKEN is not set");
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 60_000;
  return { url, token, timeoutMs };
}

function pickResponseText(data: AIResponse | string): string {
  if (typeof data === "string") return data;
  return data.response ?? data.result ?? data.text ?? data.output ?? "";
}

// Vercel's bot mitigation challenges requests that look like server-to-server
// traffic (no realistic User-Agent). Send a browser-like UA + accept header so
// it lets us through.
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
} as const;

/** Upstream answered with a non-2xx status. */
export class AIHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "AIHttpError";
  }
}

export class AITimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AI request timed out after ${timeoutMs}ms`);
    this.name = "AITimeoutError";
  }
}

/**
 * Transient failures worth one more try: timeouts, network errors (undici
 * throws TypeError "fetch failed") and 5xx. 4xx means the request itself is
 * wrong or rejected, so repeating it only burns time.
 */
export function isRetryable(err: unknown): boolean {
  if (err instanceof AIHttpError) return err.status >= 500;
  return err instanceof AITimeoutError || err instanceof TypeError;
}

const RETRY_DELAY_MS = 800;

async function readBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 1000);
  } catch {
    return "<unreadable body>";
  }
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Await inside try so an abort that lands mid-request maps to AITimeoutError.
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) throw new AITimeoutError(timeoutMs);
    throw err;
  } finally {
    clearTimeout(id);
  }
}

/**
 * One attempt. Tries GET first; if the prompt is large or the upstream
 * rejects (4xx other than 401), falls back to POST with a JSON body.
 */
async function attempt(prompt: string, url: string, token: string, timeoutMs: number): Promise<string> {
  // Long URLs trip up many proxies (414 or, oddly, 403). Skip straight to POST
  // when the encoded query is large.
  const encoded = encodeURIComponent(prompt);
  const shouldUsePost = encoded.length > 1500;

  if (!shouldUsePost) {
    const getRes = await fetchWithTimeout(`${url}?query=${encoded}`, {
      method: "GET",
      headers: {
        ...BROWSER_HEADERS,
        "x-secret-token": token,
      },
    }, timeoutMs);

    if (getRes.ok) {
      const data = (await getRes.json()) as AIResponse | string;
      return pickResponseText(data);
    }

    const body = await readBody(getRes);
    // 4xx other than 401 → try POST (some gateways block long GETs)
    if (getRes.status !== 401 && getRes.status >= 400 && getRes.status < 500) {
      console.warn(`[ai] GET ${getRes.status} ${getRes.statusText} — body: ${body} — retrying via POST`);
    } else {
      throw new AIHttpError(getRes.status, `AI request failed: ${getRes.status} ${getRes.statusText} — ${body}`);
    }
  }

  const postRes = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "x-secret-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: prompt }),
  }, timeoutMs);

  if (!postRes.ok) {
    const body = await readBody(postRes);
    throw new AIHttpError(postRes.status, `AI request failed (POST): ${postRes.status} ${postRes.statusText} — ${body}`);
  }

  const data = (await postRes.json()) as AIResponse | string;
  return pickResponseText(data);
}

/**
 * Send a prompt to the AI service. Retries once (after a short delay) on
 * timeouts, network errors and 5xx. Every call is logged to `ai_events`
 * (fire-and-forget) with its feature, latency, outcome and sizes.
 */
export async function aiQuery(prompt: string, opts: AIQueryOptions = {}): Promise<string> {
  const { url, token, timeoutMs: defaultTimeout } = getConfig();
  const timeoutMs = opts.timeoutMs ?? defaultTimeout;
  const started = Date.now();
  const log = (ok: boolean, responseChars: number, error?: unknown) =>
    logAICall({
      feature: opts.feature ?? "unknown",
      kind: "call",
      ok,
      latencyMs: Date.now() - started,
      promptChars: prompt.length,
      responseChars,
      error: error === undefined ? null : error instanceof Error ? error.message : String(error),
      studentId: opts.studentId ?? null,
    });

  for (let i = 0; ; i++) {
    try {
      const text = await attempt(prompt, url, token, timeoutMs);
      log(true, text.length);
      return text;
    } catch (err) {
      if (i === 0 && isRetryable(err)) {
        console.warn(`[ai] ${opts.feature ?? "unknown"}: ${err instanceof Error ? err.message.slice(0, 200) : err} — retrying once`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      log(false, 0, err);
      throw err;
    }
  }
}

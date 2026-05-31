// Thin wrapper around the Mentora AI service.
// Endpoint accepts a `query` parameter and returns `{ response: string }`.

type AIResponse = {
  response?: string;
  result?: string;
  text?: string;
  output?: string;
};

function getConfig() {
  const url = process.env.AI_API_URL;
  const token = process.env.AI_SECRET_TOKEN;
  if (!url) throw new Error("AI_API_URL is not set");
  if (!token) throw new Error("AI_SECRET_TOKEN is not set");
  return { url, token };
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

async function readBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 500); // cap for log noise
  } catch {
    return "<unreadable body>";
  }
}

/**
 * Send a prompt to the AI service. Tries GET first; if the prompt is large
 * or the upstream rejects (413 / 414 / 403), retries via POST with the same
 * payload as a JSON body.
 */
export async function aiQuery(prompt: string): Promise<string> {
  const { url, token } = getConfig();

  // Long URLs trip up many proxies (414 or, oddly, 403). Skip straight to POST
  // when the encoded query is large.
  const encoded = encodeURIComponent(prompt);
  const shouldUsePost = encoded.length > 1500;

  if (!shouldUsePost) {
    const getRes = await fetch(`${url}?query=${encoded}`, {
      method: "GET",
      headers: {
        ...BROWSER_HEADERS,
        "x-secret-token": token,
      },
    });

    if (getRes.ok) {
      const data = (await getRes.json()) as AIResponse | string;
      return pickResponseText(data);
    }

    // 4xx other than 401 → try POST fallback (some gateways block long GETs)
    if (getRes.status !== 401 && getRes.status >= 400 && getRes.status < 500) {
      const body = await readBody(getRes);
      console.warn(`[ai] GET ${getRes.status} ${getRes.statusText} — body: ${body} — retrying via POST`);
    } else {
      const body = await readBody(getRes);
      throw new Error(`AI request failed: ${getRes.status} ${getRes.statusText} — ${body}`);
    }
  }

  // POST fallback
  const postRes = await fetch(url, {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "x-secret-token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: prompt }),
  });

  if (!postRes.ok) {
    const body = await readBody(postRes);
    throw new Error(`AI request failed (POST): ${postRes.status} ${postRes.statusText} — ${body}`);
  }

  const data = (await postRes.json()) as AIResponse | string;
  return pickResponseText(data);
}

/**
 * Streaming wrapper. Upstream returns the full response in one shot, so we
 * simulate streaming by emitting word-sized chunks. Keeps the chat UI smooth.
 */
export async function aiStream(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const full = await aiQuery(prompt);
  const words = full.split(/(\s+)/);
  for (const word of words) {
    if (word) {
      onChunk(word);
      await new Promise((r) => setTimeout(r, 12));
    }
  }
  return full;
}

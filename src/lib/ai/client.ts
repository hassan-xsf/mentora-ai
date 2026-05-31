// Thin wrapper around the Mentora AI service.
// Single endpoint, takes a `query` param, returns `{ response: string }`.

type AIResponse = {
  response: string;
};

function getConfig() {
  const url = process.env.AI_API_URL;
  const token = process.env.AI_SECRET_TOKEN;
  if (!url) throw new Error("AI_API_URL is not set");
  if (!token) throw new Error("AI_SECRET_TOKEN is not set");
  return { url, token };
}

/**
 * Send a single prompt to the AI service and get the full response back.
 */
export async function aiQuery(prompt: string): Promise<string> {
  const { url, token } = getConfig();

  const res = await fetch(`${url}?query=${encodeURIComponent(prompt)}`, {
    method: "GET",
    headers: { "x-secret-token": token },
  });

  if (!res.ok) {
    throw new Error(`AI request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as AIResponse;
  return data.response ?? "";
}

/**
 * Streaming wrapper. The upstream API returns the full response in one shot,
 * so we simulate streaming by emitting the text in word-sized chunks. This
 * keeps the chat UI experience identical to a real token stream.
 */
export async function aiStream(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const full = await aiQuery(prompt);
  // Emit in small chunks so the UI animates rather than dumping all at once
  const words = full.split(/(\s+)/);
  for (const word of words) {
    if (word) {
      onChunk(word);
      // Small delay between chunks for a natural typewriter effect
      await new Promise((r) => setTimeout(r, 12));
    }
  }
  return full;
}

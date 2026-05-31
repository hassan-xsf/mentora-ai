import { aiQuery, aiStream } from "./client";

type HistoryEntry = { role: "user" | "model" | "assistant"; parts?: string; content?: string };

/**
 * Send a single prompt and return the full response.
 */
export async function chatCompletion(prompt: string): Promise<string> {
  return aiQuery(prompt);
}

/**
 * Streaming variant — emits chunks via callback.
 */
export async function streamChatCompletion(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  return aiStream(prompt, onChunk);
}

/**
 * Fold conversation history into a single flattened prompt and send it.
 * The upstream API takes a single query string, so we serialise history
 * as labelled turns.
 */
function buildHistoryPrompt(
  history: HistoryEntry[],
  newMessage: string,
  systemPrompt?: string
): string {
  const parts: string[] = [];
  if (systemPrompt) parts.push(`System: ${systemPrompt}`);

  for (const turn of history) {
    const text = turn.parts ?? turn.content ?? "";
    if (!text) continue;
    const label = turn.role === "user" ? "User" : "Assistant";
    parts.push(`${label}: ${text}`);
  }

  parts.push(`User: ${newMessage}`);
  parts.push("Assistant:");
  return parts.join("\n\n");
}

export async function chatCompletionWithHistory(
  history: HistoryEntry[],
  newMessage: string,
  systemPrompt?: string
): Promise<string> {
  return aiQuery(buildHistoryPrompt(history, newMessage, systemPrompt));
}

export async function streamChatWithHistory(
  history: HistoryEntry[],
  newMessage: string,
  onChunk: (chunk: string) => void,
  systemPrompt?: string
): Promise<string> {
  return aiStream(buildHistoryPrompt(history, newMessage, systemPrompt), onChunk);
}

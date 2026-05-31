import { aiQuery } from "./client";

type HistoryEntry = { role: "user" | "model" | "assistant"; parts?: string; content?: string };

export async function chatCompletion(prompt: string): Promise<string> {
  return aiQuery(prompt);
}

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

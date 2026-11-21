import { aiQuery, type AIQueryOptions } from "./client";

type HistoryEntry = { role: "user" | "model" | "assistant"; parts?: string; content?: string };

/** `opts` may be just the feature name, e.g. chatCompletion(prompt, "generate_roadmap"). */
type Opts = string | AIQueryOptions;
const toOpts = (o?: Opts): AIQueryOptions => (typeof o === "string" ? { feature: o } : o ?? {});

export async function chatCompletion(prompt: string, feature?: Opts): Promise<string> {
  return aiQuery(prompt, toOpts(feature));
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
  systemPrompt?: string,
  feature?: Opts
): Promise<string> {
  return aiQuery(buildHistoryPrompt(history, newMessage, systemPrompt), toOpts(feature));
}

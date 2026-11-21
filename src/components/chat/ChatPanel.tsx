"use client";

import { useState, useEffect, useRef } from "react";
import { AILabel } from "@/components/ui/AILabel";
import { AIFeedback } from "@/components/ai/AIFeedback";
import { PolicyRefusalNotice } from "./PolicyRefusalNotice";
import { ChatInput } from "./ChatInput";
import { ChatMarkdown } from "./ChatMarkdown";
import type { TutorContext } from "./openTutor";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Saved server-side, so it can be rated. */
  saved: boolean;
  aiError?: boolean;
};

type Props = {
  context?: TutorContext | null;
  onClearContext?: () => void;
};

export function ChatPanel({ context, onClearContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ratings, setRatings] = useState<Record<string, 1 | -1>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : { messages: [], ratings: {} }))
      .then((data: { messages?: { id: string; role: "user" | "assistant"; content: string }[]; ratings?: Record<string, 1 | -1> }) => {
        setMessages((data.messages ?? []).map((m) => ({ id: m.id, role: m.role, content: m.content, saved: true })));
        setRatings(data.ratings ?? {});
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    setError(null);

    const stamp = Date.now();
    const userId = `user-${stamp}`;
    const pendingId = `assistant-${stamp}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: text, saved: false },
      { id: pendingId, role: "assistant", content: "", saved: false },
    ]);
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, nodeId: context?.nodeId }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        id?: string | null;
        error?: string;
        aiError?: boolean;
      };

      if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);

      const reply = data.reply ?? "I didn't get a response. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { id: data.id ?? pendingId, role: "assistant", content: reply, saved: !!data.id, aiError: data.aiError }
            : m
        )
      );
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== pendingId));
      setError(e instanceof Error ? e.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {context && (
        <div className="flex items-center justify-between gap-2 border-b border-[#ebe7e1] bg-[#f5f1ec] px-4 py-2 text-[12px] text-[#626260]">
          <span className="truncate">
            Asking about: <span className="font-medium text-[#111111]">{context.title}</span>
          </span>
          {onClearContext && (
            <button type="button" onClick={onClearContext} className="shrink-0 text-[#9c9fa5] hover:text-[#111111]">
              Clear
            </button>
          )}
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d3cec6] border-t-[#111111]" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="py-8 text-center text-[13px] text-[#9c9fa5]">
            Ask me anything about your learning journey!
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-[12px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-[4px] bg-[#111111] text-white"
                  : msg.aiError
                    ? "rounded-bl-[4px] border border-[#d3cec6] bg-[#f5f1ec] text-[#626260]"
                    : "rounded-bl-[4px] border border-[#ebe7e1] bg-white text-[#111111]"
              }`}
            >
              {msg.role === "assistant" && msg.content === "" && (
                <span className="inline-block h-4 w-1 animate-pulse rounded bg-[#9c9fa5]" />
              )}
              {msg.content &&
                (msg.role === "user" || msg.aiError ? (
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                ) : (
                  <ChatMarkdown>{msg.content}</ChatMarkdown>
                ))}
              {msg.role === "assistant" && msg.content && !msg.aiError && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <AILabel compact />
                  {msg.saved && (
                    <AIFeedback feature="chat_message" targetId={msg.id} initialRating={ratings[msg.id] ?? null} />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {error && <PolicyRefusalNotice message={error} />}

        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={sending || loading} />
    </div>
  );
}

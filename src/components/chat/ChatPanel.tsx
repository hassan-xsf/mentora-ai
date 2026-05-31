"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AILabel } from "@/components/ui/AILabel";
import { PolicyRefusalNotice } from "./PolicyRefusalNotice";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type Props = {
  nodeContext?: string;
};

export function ChatPanel({ nodeContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);
      setMessages((data ?? []) as Message[]);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;
      setError(null);

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            nodeContext,
            history: messages.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = (await response.json().catch(() => ({}))) as {
          reply?: string;
          error?: string;
          aiError?: boolean;
        };

        if (!response.ok) {
          throw new Error(data.error ?? `HTTP ${response.status}`);
        }

        const reply = data.reply ?? "I didn't get a response. Please try again.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: reply } : m
          )
        );

        if (data.aiError) {
          setError(reply);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to send message.";
        const display = `${msg}. Please try again.`;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: display } : m
          )
        );
        setError(display);
      } finally {
        setStreaming(false);
      }
    },
    [streaming, messages, nodeContext]
  );

  // Expose sendMessage via data attribute for ChatInput
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (panelRef.current) {
      (panelRef.current as HTMLDivElement & { __sendMessage?: typeof sendMessage }).__sendMessage = sendMessage;
    }
  }, [sendMessage]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div ref={panelRef} id="chat-panel" className="flex flex-1 flex-col overflow-hidden">
      {/* Context banner */}
      {nodeContext && (
        <div className="border-b border-violet-100 bg-violet-50 px-4 py-2 text-xs text-violet-600">
          Asking about: <span className="font-medium">{nodeContext}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="py-8 text-center text-sm text-gray-400">
            Ask me anything about your learning journey!
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" && msg.content === "" && (
                <span className="inline-block h-4 w-1 animate-pulse bg-gray-400 rounded" />
              )}
              {msg.content && (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
              {msg.role === "assistant" && msg.content && (
                <div className="mt-1.5">
                  <AILabel compact />
                </div>
              )}
            </div>
          </div>
        ))}

        {error && <PolicyRefusalNotice message={error} />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// Export sendMessage type for ChatInput
export type ChatPanelRef = {
  sendMessage: (text: string) => Promise<void>;
};

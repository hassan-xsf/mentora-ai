import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatCompletionWithHistory } from "@/lib/ai/stream";
import { saveChatMessage } from "@/lib/db/chat";

const SYSTEM_PROMPT = `You are an AI educational assistant for students learning new career skills.
You ONLY answer questions related to education, learning, programming, technology, career development, and academic topics.
If a user asks about anything unrelated to education or learning, politely decline and redirect them to educational topics.
Keep responses clear, encouraging, and educational. Use examples and explanations that help students learn.
Do not discuss politics, entertainment gossip, illegal activities, or any off-topic subjects.`;

type MessageEntry = {
  role: "user" | "assistant";
  content: string;
};

function friendlyAIError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("403")) {
    return "The AI service blocked this request (403). The firewall rule may still be deploying — please try again in a minute.";
  }
  if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
    return "The AI service is rate-limited right now. Please wait a moment and try again.";
  }
  if (msg.includes("503") || msg.toLowerCase().includes("unavailable")) {
    return "The AI service is temporarily unavailable. Please try again shortly.";
  }
  if (msg.toLowerCase().includes("fetch failed") || msg.toLowerCase().includes("network")) {
    return "Couldn't reach the AI service. Check your connection and try again.";
  }
  return `AI service error: ${msg.slice(0, 200)}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      message: string;
      nodeContext?: string;
      history?: MessageEntry[];
    };

    const { message, nodeContext, history = [] } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await saveChatMessage(user.id, "user", message);

    const contextualMessage = nodeContext
      ? `[Context: Student is studying "${nodeContext}"]\n\n${message}`
      : message;

    const aiHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const reply = await chatCompletionWithHistory(aiHistory, contextualMessage, SYSTEM_PROMPT);
      const text = reply.trim() || "I didn't get a response. Please try again.";
      await saveChatMessage(user.id, "assistant", text).catch(() => undefined);
      return NextResponse.json({ reply: text });
    } catch (err) {
      console.error("[chat] AI error:", err);
      const friendly = friendlyAIError(err);
      await saveChatMessage(user.id, "assistant", friendly).catch(() => undefined);
      // 200 with an error flag so the UI can render it inline as an assistant message
      return NextResponse.json({ reply: friendly, aiError: true });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

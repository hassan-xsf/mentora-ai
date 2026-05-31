import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamChatWithHistory } from "@/lib/ai/stream";
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

    // Save user message to DB
    await saveChatMessage(user.id, "user", message);

    const contextualMessage = nodeContext
      ? `[Context: Student is studying "${nodeContext}"]\n\n${message}`
      : message;

    // Build history shape expected by the AI helper
    const aiHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    let fullText = "";

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          await streamChatWithHistory(
            aiHistory,
            contextualMessage,
            (chunk) => {
              fullText += chunk;
              controller.enqueue(encoder.encode(chunk));
            },
            SYSTEM_PROMPT
          );
        } finally {
          // Save assistant response to DB
          await saveChatMessage(user.id, "assistant", fullText);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

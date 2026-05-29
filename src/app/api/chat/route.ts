import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/openai/client";
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

    const model = getModel();

    // Build history for Gemini: role mapping assistant -> model
    const geminiHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: msg.content }],
    }));

    // Prepend system context as a user/model exchange if no history
    const fullHistory =
      geminiHistory.length === 0
        ? [
            {
              role: "user" as const,
              parts: [{ text: SYSTEM_PROMPT + "\n\nUnderstood. I will only help with educational topics." }],
            },
            {
              role: "model" as const,
              parts: [{ text: "Understood. I'm your educational assistant and I'll only help with learning, programming, technology, and career development topics." }],
            },
          ]
        : [
            {
              role: "user" as const,
              parts: [{ text: SYSTEM_PROMPT }],
            },
            {
              role: "model" as const,
              parts: [{ text: "Understood. I'm your educational assistant." }],
            },
            ...geminiHistory,
          ];

    const contextualMessage = nodeContext
      ? `[Context: Student is studying "${nodeContext}"]\n\n${message}`
      : message;

    const chat = model.startChat({ history: fullHistory });
    const result = await chat.sendMessageStream(contextualMessage);

    // Collect full response and stream it
    let fullText = "";

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const delta = chunk.text();
            if (delta) {
              fullText += delta;
              controller.enqueue(encoder.encode(delta));
            }
          }
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

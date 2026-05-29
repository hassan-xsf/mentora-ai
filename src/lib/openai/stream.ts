import { getModel } from "./client";

export async function streamChatCompletion(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const model = getModel();
  const result = await model.generateContentStream(prompt);

  let fullText = "";
  for await (const chunk of result.stream) {
    const delta = chunk.text();
    if (delta) {
      fullText += delta;
      onChunk(delta);
    }
  }
  return fullText;
}

export async function chatCompletion(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function chatCompletionWithHistory(
  history: { role: "user" | "model"; parts: string }[],
  newMessage: string
): Promise<string> {
  const model = getModel();
  const chat = model.startChat({
    history: history.map((h) => ({
      role: h.role,
      parts: [{ text: h.parts }],
    })),
  });
  const result = await chat.sendMessage(newMessage);
  return result.response.text();
}

export async function streamChatWithHistory(
  history: { role: "user" | "model"; parts: string }[],
  newMessage: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const model = getModel();
  const chat = model.startChat({
    history: history.map((h) => ({
      role: h.role,
      parts: [{ text: h.parts }],
    })),
  });
  const result = await chat.sendMessageStream(newMessage);

  let fullText = "";
  for await (const chunk of result.stream) {
    const delta = chunk.text();
    if (delta) {
      fullText += delta;
      onChunk(delta);
    }
  }
  return fullText;
}

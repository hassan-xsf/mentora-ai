import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini 2.5 Flash Lite — cheapest available model
export const AI_MODEL = "gemini-2.5-flash-lite" as const;

let _client: GoogleGenerativeAI | null = null;

export function getAIClient(): GoogleGenerativeAI {
  if (!_client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _client;
}

export function getModel() {
  return getAIClient().getGenerativeModel({ model: AI_MODEL });
}

export type AppError = {
  code: string;
  message: string;
  status: number;
};

export function toAppError(error: unknown): AppError {
  if (error instanceof Error) {
    return { code: "UNKNOWN", message: error.message, status: 500 };
  }
  return { code: "UNKNOWN", message: "An unexpected error occurred.", status: 500 };
}

export function isAIUnavailable(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("503") ||
      msg.includes("rate limit") ||
      msg.includes("overloaded")
    );
  }
  return false;
}

export const AI_UNAVAILABLE_MESSAGE =
  "Our AI service is currently unavailable. Please try again in a moment.";

export function isAIRateLimited(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("resource_exhausted") ||
      msg.includes("exceeded")
    );
  }
  return false;
}

export const AI_RATE_LIMIT_MESSAGE =
  "AI rate limit reached. Please wait a moment and try again.";

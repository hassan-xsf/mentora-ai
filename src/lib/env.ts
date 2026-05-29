const publicRequired = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

function assertEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    get secretKey() { return assertEnv("SUPABASE_SECRET_KEY"); },
  },
  gemini: {
    get apiKey() { return assertEnv("GEMINI_API_KEY"); },
  },
} as const;

if (typeof window !== "undefined") {
  for (const key of publicRequired) {
    if (!process.env[key]) {
      console.error(`[env] Missing required public env var: ${key}`);
    }
  }
}

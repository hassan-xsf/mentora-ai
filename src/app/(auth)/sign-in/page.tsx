"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[32px] font-medium leading-[1.15] tracking-[-0.8px] text-[#111111]">
          Welcome back
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#626260]">
          Sign in to continue your learning journey.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-[#111111]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isPending}
            className="h-11 w-full rounded-[8px] border border-[#d3cec6] bg-white px-3.5 text-[15px] text-[#111111] placeholder:text-[#9c9fa5] outline-none transition-colors focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 disabled:opacity-50"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[13px] font-medium text-[#111111]">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isPending}
            className="h-11 w-full rounded-[8px] border border-[#d3cec6] bg-white px-3.5 text-[15px] text-[#111111] placeholder:text-[#9c9fa5] outline-none transition-colors focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 disabled:opacity-50"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-[8px] border border-[#c41c1c]/20 bg-[#c41c1c]/5 px-4 py-3 text-[13px] text-[#c41c1c]">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 h-11 w-full rounded-[8px] bg-[#111111] px-4.5 text-[15px] font-medium text-white transition-colors hover:bg-black active:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#d3cec6]" />
        <span className="text-[12px] text-[#9c9fa5]">new here?</span>
        <div className="h-px flex-1 bg-[#d3cec6]" />
      </div>

      {/* Sign up CTA — secondary button style */}
      <Link
        href="/sign-up"
        className="flex h-11 w-full items-center justify-center rounded-[8px] border border-[#d3cec6] bg-white px-4.5 text-[15px] font-medium text-[#111111] transition-colors hover:bg-[#f5f1ec]"
      >
        Create an account
      </Link>
    </div>
  );
}

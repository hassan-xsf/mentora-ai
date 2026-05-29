"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        await supabase.from("students").upsert({
          id: data.user.id,
          email,
          full_name: fullName || null,
        });
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
          Create account
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#626260]">
          Start building your personalised career roadmap.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-[13px] font-medium text-[#111111]">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
            disabled={isPending}
            className="h-11 w-full rounded-[8px] border border-[#d3cec6] bg-white px-3.5 text-[15px] text-[#111111] placeholder:text-[#9c9fa5] outline-none transition-colors focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 disabled:opacity-50"
          />
        </div>

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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
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

        {/* Submit — Fin Orange for primary AI CTA */}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 h-11 w-full rounded-[8px] bg-[#ff5600] px-4.5 text-[15px] font-medium text-white transition-colors hover:bg-[#e04d00] active:bg-[#cc4500] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating account…" : "Get started"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#d3cec6]" />
        <span className="text-[12px] text-[#9c9fa5]">already a member?</span>
        <div className="h-px flex-1 bg-[#d3cec6]" />
      </div>

      {/* Sign in CTA */}
      <Link
        href="/sign-in"
        className="flex h-11 w-full items-center justify-center rounded-[8px] border border-[#d3cec6] bg-white px-4.5 text-[15px] font-medium text-[#111111] transition-colors hover:bg-[#f5f1ec]"
      >
        Sign in instead
      </Link>

      {/* Terms note */}
      <p className="mt-5 text-center text-[12px] text-[#9c9fa5]">
        By creating an account you agree to our terms of service.
      </p>
    </div>
  );
}

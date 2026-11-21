"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "h-11 w-full rounded-[8px] border border-[#d3cec6] bg-white px-3.5 text-[15px] text-[#111111] placeholder:text-[#9c9fa5] outline-none transition-colors focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 disabled:opacity-50";

function ForgotPasswordForm() {
  const linkExpired = useSearchParams().get("error") === "link";
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      // Supabase answers the same for unknown emails, so this only surfaces
      // real failures (rate limit, invalid address).
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div role="status">
        <h1 className="text-[32px] font-medium leading-[1.15] tracking-[-0.8px] text-[#111111]">
          Check your email
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#626260]">
          If an account exists for <span className="font-medium text-[#111111]">{email}</span>, we&rsquo;ve
          sent a link to reset your password. Open it in this browser. It expires in one hour.
        </p>
        <Link
          href="/sign-in"
          className="mt-8 flex h-11 w-full items-center justify-center rounded-[8px] border border-[#d3cec6] bg-white text-[15px] font-medium text-[#111111] transition-colors hover:bg-[#f5f1ec]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[32px] font-medium leading-[1.15] tracking-[-0.8px] text-[#111111]">
          Reset your password
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#626260]">
          Enter the email you signed up with and we&rsquo;ll send you a reset link.
        </p>
      </div>

      {linkExpired && (
        <div className="mb-4 rounded-[8px] border border-[#c41c1c]/20 bg-[#c41c1c]/5 px-4 py-3 text-[13px] text-[#c41c1c]">
          That link has expired or was already used. Request a new one below.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            className={inputClass}
          />
        </div>

        {error && (
          <div role="alert" className="rounded-[8px] border border-[#c41c1c]/20 bg-[#c41c1c]/5 px-4 py-3 text-[13px] text-[#c41c1c]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 h-11 w-full rounded-[8px] bg-[#111111] text-[15px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[#626260]">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-medium text-[#111111] underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  // useSearchParams needs a Suspense boundary for the static prerender.
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}

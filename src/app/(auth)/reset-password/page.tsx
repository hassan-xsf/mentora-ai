"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePassword, type ActionState } from "@/app/actions/auth";

const inputClass =
  "h-11 w-full rounded-[8px] border border-[#d3cec6] bg-white px-3.5 text-[15px] text-[#111111] placeholder:text-[#9c9fa5] outline-none transition-colors focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 disabled:opacity-50";

export default function ResetPasswordPage() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(updatePassword, { error: null });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[32px] font-medium leading-[1.15] tracking-[-0.8px] text-[#111111]">
          Choose a new password
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#626260]">
          You&rsquo;ll stay signed in on this device after saving.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[13px] font-medium text-[#111111]">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Min 6 characters"
            disabled={isPending}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-[13px] font-medium text-[#111111]">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            disabled={isPending}
            className={inputClass}
          />
        </div>

        {state.error && (
          <div role="alert" className="rounded-[8px] border border-[#c41c1c]/20 bg-[#c41c1c]/5 px-4 py-3 text-[13px] text-[#c41c1c]">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 h-11 w-full rounded-[8px] bg-[#111111] text-[15px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save password"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[#626260]">
        Link expired?{" "}
        <Link href="/forgot-password" className="font-medium text-[#111111] underline-offset-4 hover:underline">
          Send a new one
        </Link>
      </p>
    </div>
  );
}

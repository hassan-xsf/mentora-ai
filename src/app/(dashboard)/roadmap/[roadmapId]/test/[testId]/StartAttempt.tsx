"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startMilestoneAttempt } from "@/app/actions/generate-milestone-test";

type Props = {
  testId: string;
  cost: number;
  /** ISO time the retry cooldown ends, when a failed attempt is recent. */
  cooldownEndsAt: string | null;
  hasAttempts: boolean;
};

export default function StartAttempt({ testId, cost, cooldownEndsAt, hasAttempts }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());

  const remainingMs = cooldownEndsAt ? Date.parse(cooldownEndsAt) - now : 0;
  const coolingDown = remainingMs > 0;

  useEffect(() => {
    if (!coolingDown) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [coolingDown]);

  function start() {
    setError(null);
    startTransition(async () => {
      const res = await startMilestoneAttempt(testId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  const mm = Math.floor(remainingMs / 60_000);
  const ss = Math.floor((remainingMs % 60_000) / 1000).toString().padStart(2, "0");

  return (
    <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6 text-center">
      <p className="text-[14px] font-medium text-[#111111]">
        {hasAttempts ? "Ready for another go?" : "Ready when you are"}
      </p>
      <p className="mx-auto mt-1 max-w-md text-[13px] text-[#626260]">
        4 multiple-choice questions and 1 short answer, written fresh for every attempt and graded on the server.
      </p>
      {coolingDown ? (
        <p className="mt-4 text-[13px] text-[#626260]" aria-live="polite">
          Revise your weak topics first. Next attempt in{" "}
          <span className="font-medium tabular-nums text-[#111111]">
            {mm}:{ss}
          </span>
        </p>
      ) : null}
      <button
        type="button"
        onClick={start}
        disabled={isPending || coolingDown}
        className="mt-5 inline-flex items-center gap-2 rounded-[8px] bg-[#111111] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:opacity-40"
      >
        {isPending ? "Writing your questions…" : `${hasAttempts ? "Start a new attempt" : "Start test"} · ${cost} credits`}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-[13px] text-[#c41c1c]">
          {error}
        </p>
      )}
    </div>
  );
}

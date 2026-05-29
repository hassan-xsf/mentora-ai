"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateRoadmap } from "@/app/actions/generate-roadmap";

type Props = {
  careerTitle: string;
  careerDescription: string;
};

const STEPS = [
  "Designing your roadmap…",
  "Building learning sections…",
  "Adding resources & tasks…",
  "Finalising your path…",
];

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function GenerateRoadmapButton({ careerTitle, careerDescription }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setStepIdx(0);

    // Cycle through step messages while pending
    const interval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }, 3500);

    startTransition(async () => {
      try {
        const { roadmapId } = await generateRoadmap(careerTitle, careerDescription);
        clearInterval(interval);
        router.push(`/roadmap/${roadmapId}`);
      } catch (err) {
        clearInterval(interval);
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    });
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="rounded-[8px] border border-[#c41c1c]/20 bg-[#c41c1c]/5 px-3 py-2.5 text-[12px] text-[#c41c1c]">
          {error}
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="flex h-10 w-full items-center justify-center rounded-[8px] bg-[#111111] text-[13px] font-medium text-white transition-colors hover:bg-black"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#111111] px-4 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-80"
    >
      {isPending ? (
        <>
          <Spinner />
          <span className="truncate">{STEPS[stepIdx]}</span>
        </>
      ) : (
        <>
          <span>Generate Roadmap</span>
          <span aria-hidden>→</span>
        </>
      )}
    </button>
  );
}

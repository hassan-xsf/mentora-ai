import { Suspense } from "react";
import Link from "next/link";
import { AILabel } from "@/components/ui/AILabel";
import { AIFallbackBadge } from "@/components/ui/AIFallbackBadge";
import { getCareerSuggestions } from "@/app/actions/career-suggestions";
import type { AssessmentAnswer } from "@/types";
import CareerResultsClient from "./CareerResultsClient";

type Props = {
  searchParams: Promise<{ answers?: string }>;
};

function SkeletonCard() {
  return (
    <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-32 animate-pulse rounded-[4px] bg-[#ebe7e1]" />
        <div className="h-4 w-16 animate-pulse rounded-[4px] bg-[#ebe7e1]" />
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 w-full animate-pulse rounded-full bg-[#ebe7e1]" />
        <div className="flex justify-between">
          <div className="h-3 w-12 animate-pulse rounded bg-[#ebe7e1]" />
          <div className="h-3 w-8 animate-pulse rounded bg-[#ebe7e1]" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded bg-[#ebe7e1]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[#ebe7e1]" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-[#ebe7e1]" />
      </div>
      <div className="h-16 animate-pulse rounded-[8px] bg-[#f5f1ec]" />
      <div className="h-10 animate-pulse rounded-[8px] bg-[#ebe7e1]" />
    </div>
  );
}

async function CareerResults({ answers }: { answers: AssessmentAnswer[] }) {
  const { suggestions, usedFallback } = await getCareerSuggestions(answers);

  if (suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#d3cec6] bg-white px-8 py-16 text-center">
        <p className="text-[14px] text-[#626260]">
          No career suggestions could be generated. Please try again.
        </p>
        <Link
          href="/assessment"
          className="mt-4 inline-flex h-10 items-center rounded-[8px] bg-[#111111] px-5 text-[13px] font-medium text-white hover:bg-black"
        >
          Retake assessment
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {usedFallback && (
        <AIFallbackBadge label="Generic career suggestions" />
      )}
      <CareerResultsClient suggestions={suggestions} />
    </div>
  );
}

export default async function AssessmentResultsPage({ searchParams }: Props) {
  const params = await searchParams;
  let answers: AssessmentAnswer[] = [];

  if (params.answers) {
    try {
      answers = JSON.parse(params.answers) as AssessmentAnswer[];
    } catch {
      answers = [];
    }
  }

  if (answers.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f1ec] p-6">
        <div className="rounded-2xl border border-[#d3cec6] bg-white px-8 py-14 text-center max-w-sm w-full">
          <h1 className="text-[20px] font-medium tracking-[-0.3px] text-[#111111]">
            No assessment data
          </h1>
          <p className="mt-2 text-[14px] text-[#626260]">
            Please complete the assessment first.
          </p>
          <Link
            href="/assessment"
            className="mt-5 inline-flex h-10 items-center rounded-[8px] bg-[#ff5600] px-5 text-[13px] font-medium text-white hover:bg-[#e04d00]"
          >
            Take Assessment →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">
              Career Discovery
            </p>
            <h1 className="mt-1 text-[32px] font-medium leading-[1.15] tracking-[-0.8px] text-[#111111]">
              Your Career Matches
            </h1>
            <p className="mt-2 text-[15px] text-[#626260]">
              Based on your assessment answers — click any career to generate a personalised roadmap.
            </p>
          </div>
          <AILabel />
        </div>

        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          }
        >
          <CareerResults answers={answers} />
        </Suspense>
      </div>
    </div>
  );
}

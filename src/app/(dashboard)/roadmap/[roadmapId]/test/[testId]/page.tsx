import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMilestoneTestById } from "@/lib/db/milestone-tests";
import { createAdminClient } from "@/lib/supabase/admin";
import { AIFallbackBadge } from "@/components/ui/AIFallbackBadge";
import { generateMilestoneTest } from "@/app/actions/generate-milestone-test";
import TestForm from "./TestForm";
import type { MilestoneQuestion, MilestoneTest } from "@/types";

type Props = {
  params: Promise<{ roadmapId: string; testId: string }>;
};

export default async function TestPage({ params }: Props) {
  const { roadmapId, testId } = await params;
  await requireUser();

  let test = await getMilestoneTestById(testId);
  if (!test) notFound();

  // If no questions yet, generate them and re-read via admin client
  if (!test.questions || (Array.isArray(test.questions) && test.questions.length === 0)) {
    await generateMilestoneTest(testId, roadmapId, test.title);

    // Re-fetch using admin client to avoid any RLS/cache weirdness
    const admin = createAdminClient();
    const { data } = await admin
      .from("milestone_tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (data) test = data as MilestoneTest;
  }

  const questions = (test.questions ?? []) as MilestoneQuestion[];

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">

        {/* Back link */}
        <Link
          href={`/roadmap/${roadmapId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[#9c9fa5] transition-colors hover:text-[#111111]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Roadmap
        </Link>

        {/* Header card */}
        <div className="mb-6 rounded-[12px] border border-[#d3cec6] bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Milestone Test</p>
              <h1 className="mt-1 text-[24px] font-medium leading-tight tracking-[-0.4px] text-[#111111]">
                {test.title}
              </h1>
            </div>
            {test.used_fallback && <AIFallbackBadge compact label="Fallback" />}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[13px] text-[#626260]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Score ≥70% to unlock the next section
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-[12px] border border-[#d3cec6] bg-white px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f1ec]">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 6v4M10 14h.01" stroke="#9c9fa5" strokeWidth="2" strokeLinecap="round" />
                <circle cx="10" cy="10" r="8" stroke="#9c9fa5" strokeWidth="2" />
              </svg>
            </div>
            <p className="text-[14px] font-medium text-[#111111]">Questions not ready yet</p>
            <p className="mt-1 text-[13px] text-[#9c9fa5]">
              Something went wrong generating this test. Try the button below.
            </p>
            <Link
              href={`/roadmap/${roadmapId}/test/${testId}`}
              className="mt-5 inline-flex items-center gap-2 rounded-[8px] bg-[#111111] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-black"
            >
              Try again →
            </Link>
          </div>
        ) : (
          <TestForm
            test={test}
            questions={questions}
            roadmapId={roadmapId}
          />
        )}
      </div>
    </div>
  );
}

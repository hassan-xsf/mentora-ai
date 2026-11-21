import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getLatestAttempt, getOpenSession, getOwnedTest } from "@/lib/db/milestone-tests";
import { cooldownEndsAt, PASS_MARK, toPublic } from "@/lib/adaptive/questions";
import { CREDIT_COSTS } from "@/lib/credits/config";
import { AIFallbackBadge } from "@/components/ui/AIFallbackBadge";
import { TestResults, type WeakTopic } from "@/components/roadmap/TestResults";
import TestForm from "./TestForm";
import StartAttempt from "./StartAttempt";

// Starting (generation) and submitting (grading + explanations) call the AI.
export const maxDuration = 120;

type Props = {
  params: Promise<{ roadmapId: string; testId: string }>;
};

export default async function TestPage({ params }: Props) {
  const { roadmapId, testId } = await params;
  const user = await requireUser();

  const test = await getOwnedTest(testId, user.id);
  if (!test || test.roadmap_id !== roadmapId) notFound();

  const [session, latest] = await Promise.all([
    getOpenSession(testId, user.id),
    getLatestAttempt(testId, user.id),
  ]);

  let weakTopics: WeakTopic[] = [];
  const missedNodeIds = [...new Set((latest?.results ?? []).filter((r) => !r.is_correct && r.node_id).map((r) => r.node_id!))];
  if (missedNodeIds.length) {
    const supabase = await createClient();
    const [{ data: nodes }, { data: items }] = await Promise.all([
      supabase.from("nodes").select("id, title").in("id", missedNodeIds),
      supabase.from("review_items").select("id, node_id").eq("student_id", user.id).in("node_id", missedNodeIds),
    ]);
    const itemFor = new Map((items ?? []).map((i) => [i.node_id, i.id]));
    weakTopics = (nodes ?? []).map((n) => ({ nodeId: n.id, title: n.title, reviewItemId: itemFor.get(n.id) ?? null }));
  }

  const cooldown = cooldownEndsAt(latest, new Date());

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href={`/roadmap/${roadmapId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[#9c9fa5] transition-colors hover:text-[#111111]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Roadmap
        </Link>

        <div className="mb-6 rounded-[12px] border border-[#d3cec6] bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Milestone Test</p>
              <h1 className="mt-1 text-[24px] font-medium leading-tight tracking-[-0.4px] text-[#111111]">{test.title}</h1>
            </div>
            {session?.used_fallback && <AIFallbackBadge compact label="Practice" />}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[13px] text-[#626260]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Score ≥{PASS_MARK}% to unlock the next section · 10-minute cooldown after a failed attempt
          </div>
        </div>

        {!test.unlocked ? (
          <div className="rounded-[12px] border border-[#d3cec6] bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-medium text-[#111111]">This section is locked</p>
            <p className="mt-1 text-[13px] text-[#9c9fa5]">Pass the previous milestone test first.</p>
          </div>
        ) : session ? (
          <div className="space-y-4">
            {session.used_fallback && (
              <div className="rounded-[12px] border border-[#ff5600]/30 bg-[#fff7f2] px-5 py-4 text-[13px] text-[#626260]">
                <span className="font-medium text-[#111111]">Practice mode.</span> The AI couldn&apos;t write questions
                just now, so these are generic ones from your roadmap. You weren&apos;t charged, and this attempt
                can&apos;t unlock the next section.
              </div>
            )}
            <TestForm sessionId={session.id} questions={session.questions.map(toPublic)} />
          </div>
        ) : (
          <div className="space-y-5">
            {latest && <TestResults attempt={latest} weakTopics={weakTopics} />}
            <StartAttempt
              testId={testId}
              cost={CREDIT_COSTS.generate_milestone_test}
              cooldownEndsAt={cooldown?.toISOString() ?? null}
              hasAttempts={!!latest}
            />
          </div>
        )}
      </div>
    </div>
  );
}

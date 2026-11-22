import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getOwnedReviewItem, getRemedialPlan, today } from "@/lib/adaptive/review";
import { isDue } from "@/lib/adaptive/schedule";
import { AIFeedback } from "@/components/ai/AIFeedback";
import { AIFallbackBadge } from "@/components/ui/AIFallbackBadge";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import QuickCheck from "./QuickCheck";

// The first visit to a topic generates its remedial plan.
export const maxDuration = 60;

type Props = { params: Promise<{ itemId: string }> };

export default async function ReviewItemPage({ params }: Props) {
  const { itemId } = await params;
  const user = await requireUser();
  const item = await getOwnedReviewItem(itemId, user.id);
  if (!item) notFound();

  const plan = await getRemedialPlan(item, user.id);
  const due = isDue(item.due_date, today());

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/review"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[#9c9fa5] transition-colors hover:text-[#111111]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Review
        </Link>

        <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">{item.roadmap_title}</p>
              <h1 className="mt-1 text-[24px] font-medium leading-tight tracking-[-0.4px] text-[#111111]">{item.node.title}</h1>
            </div>
            {plan.used_fallback && <AIFallbackBadge compact label="Fallback" />}
          </div>
          {/* The AI writes the lesson in markdown (*emphasis*, `code`). */}
          <div className="mt-4 text-[14px] leading-relaxed text-[#313130] [&_p]:my-2.5">
            <ChatMarkdown>{plan.explanation}</ChatMarkdown>
          </div>
          {!plan.used_fallback && (
            <div className="mt-4 flex justify-end">
              <AIFeedback feature="remedial_plan" targetId={item.node.id} />
            </div>
          )}
        </div>

        <div className="mt-4 rounded-[12px] border border-[#d3cec6] bg-white p-6">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#ff5600]">Practice task</p>
          <div className="mt-2 text-[14px] leading-relaxed text-[#111111] [&_p]:my-2.5">
            <ChatMarkdown>{plan.practice_task}</ChatMarkdown>
          </div>
        </div>

        <div className="mt-4">
          <QuickCheck
            itemId={item.id}
            questions={plan.check_questions.map((q, i) => ({ id: `c${i + 1}`, question: q.question, options: q.options }))}
            due={due}
            dueDate={item.due_date}
          />
        </div>
      </div>
    </div>
  );
}

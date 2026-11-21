import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getReviewQueue, today } from "@/lib/adaptive/review";
import { REVIEW_INTERVALS } from "@/lib/adaptive/schedule";

export const metadata = { title: "Review" };

function dayLabel(due: string, now: string): string {
  const days = Math.round((Date.parse(due) - Date.parse(now)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export default async function ReviewPage() {
  const user = await requireUser();
  const queue = await getReviewQueue(user.id);
  const now = today();
  const due = queue.filter((i) => i.due_date <= now);
  const upcoming = queue.filter((i) => i.due_date > now);

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Spaced repetition</p>
        <h1 className="mt-1 text-[28px] font-medium tracking-[-0.5px] text-[#111111]">Review</h1>
        <p className="mt-1 max-w-lg text-[13.5px] text-[#626260]">
          Topics you missed in milestone tests come back here at growing intervals ({REVIEW_INTERVALS.join(", ")} days).
          Pass the quick check to push a topic further out; miss it and it starts again tomorrow.
        </p>

        <section className="mt-6">
          <h2 className="mb-3 text-[14px] font-medium text-[#111111]">
            Due today <span className="text-[#9c9fa5]">· {due.length}</span>
          </h2>
          {due.length === 0 ? (
            <div className="rounded-[12px] border border-[#d3cec6] bg-white px-6 py-8 text-center">
              <p className="text-[14px] font-medium text-[#111111]">All caught up</p>
              <p className="mt-1 text-[13px] text-[#9c9fa5]">
                {queue.length ? "Nothing is due today. Come back when the next review is due." : "Take a milestone test. Any topic you miss will show up here."}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {due.map((i) => (
                <li key={i.id}>
                  <Link
                    href={`/review/${i.id}`}
                    className="flex items-center justify-between gap-3 rounded-[12px] border border-[#d3cec6] bg-white px-5 py-4 transition-colors hover:border-[#111111]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-[#111111]">{i.node_title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-[#9c9fa5]">
                        {i.roadmap_title} · step {i.stage + 1} of {REVIEW_INTERVALS.length}
                        {i.lapses > 0 && ` · missed ${i.lapses}×`}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-[8px] bg-[#111111] px-3 py-1.5 text-[12px] font-medium text-white">
                      Review →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {upcoming.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[14px] font-medium text-[#111111]">
              Coming up <span className="text-[#9c9fa5]">· {upcoming.length}</span>
            </h2>
            <ul className="divide-y divide-[#ebe7e1] rounded-[12px] border border-[#d3cec6] bg-white">
              {upcoming.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <Link href={`/review/${i.id}`} className="min-w-0 truncate text-[13.5px] text-[#111111] hover:underline">
                    {i.node_title}
                  </Link>
                  <span className="shrink-0 text-[12px] text-[#9c9fa5]">{dayLabel(i.due_date, now)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

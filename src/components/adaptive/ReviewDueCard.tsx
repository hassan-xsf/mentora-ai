import Link from "next/link";
import { countDueReviews } from "@/lib/adaptive/review";

/** Dashboard card: how many weak topics are due for spaced review today. */
export async function ReviewDueCard({ studentId }: { studentId: string }) {
  const due = await countDueReviews(studentId);

  return (
    <Link
      href="/review"
      className="flex items-center justify-between gap-4 rounded-[12px] border border-[#d3cec6] bg-white p-5 transition-colors hover:border-[#111111]"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Review</p>
        <p className="mt-1 text-[16px] font-medium text-[#111111]">
          {due === 0 ? "All caught up" : `${due} topic${due === 1 ? "" : "s"} due today`}
        </p>
        <p className="mt-0.5 text-[12.5px] text-[#626260]">
          {due === 0 ? "Missed test topics come back here on a spaced schedule." : "A short lesson and a quick check for each."}
        </p>
      </div>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-medium ${
          due > 0 ? "bg-[#ff5600] text-white" : "bg-[#ebe7e1] text-[#626260]"
        }`}
      >
        {due}
      </span>
    </Link>
  );
}

export default ReviewDueCard;

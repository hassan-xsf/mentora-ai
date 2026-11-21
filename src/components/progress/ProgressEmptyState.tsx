import Link from "next/link";

export function ProgressEmptyState() {
  return (
    <div className="rounded-[12px] border border-dashed border-[#d3cec6] bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0ece5] text-[22px]">
        📊
      </div>
      <h2 className="text-[18px] font-medium tracking-[-0.2px] text-[#111111]">No activity yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-[13px] text-[#626260]">
        Start learning to track your progress. Study time, topics, tests and coding challenges
        all show up here.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/assessment"
          className="rounded-[8px] bg-[#111111] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
        >
          Start a roadmap
        </Link>
        <Link
          href="/practice"
          className="rounded-[8px] border border-[#d3cec6] bg-white px-4 py-2 text-[13px] font-medium text-[#626260] transition-colors hover:border-[#111111] hover:text-[#111111]"
        >
          Try practice
        </Link>
      </div>
    </div>
  );
}

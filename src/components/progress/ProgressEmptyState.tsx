import Link from "next/link";

export function ProgressEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
        📊
      </div>
      <h2 className="text-xl font-semibold text-gray-900">No activity yet</h2>
      <p className="mt-2 max-w-sm text-gray-500">
        Start learning to track your progress. Complete nodes, take tests, and solve coding
        challenges to see your stats here.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/assessment"
          className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
        >
          Start a Roadmap
        </Link>
        <Link
          href="/practice"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          Try Practice
        </Link>
      </div>
    </div>
  );
}

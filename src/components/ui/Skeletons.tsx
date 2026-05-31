import { cn } from "@/lib/utils";

// ── Primitives ──────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[6px] bg-[#ebe7e1]", className)} />;
}

// ── Stat card skeleton (used across dashboard + progress) ──────────────────

export function StatCardSkeleton() {
  return (
    <div className="rounded-[12px] border border-[#d3cec6] bg-white px-5 py-4">
      <Skeleton className="h-2.5 w-16" />
      <Skeleton className="mt-2.5 h-7 w-12" />
      <Skeleton className="mt-2 h-2.5 w-20" />
    </div>
  );
}

// ── Roadmap card skeleton (dashboard grid) ─────────────────────────────────

export function RoadmapCardSkeleton() {
  return (
    <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-2 h-2.5 w-1/2" />
        </div>
        <Skeleton className="h-5 w-10" />
      </div>
      <Skeleton className="h-1.5 w-full" />
      <Skeleton className="mt-2 h-2.5 w-1/3" />
      <Skeleton className="mt-4 h-9 w-full rounded-[8px]" />
    </div>
  );
}

// ── Dashboard page skeleton ────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* Header */}
        <div>
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="mt-2 h-9 w-56" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>

        {/* XP bar */}
        <div className="rounded-[12px] border border-[#d3cec6] bg-white px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-[10px]" />
              <div>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </div>
            </div>
            <div className="w-full sm:flex-1 sm:max-w-xs">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="mt-2 h-2 w-full" />
            </div>
            <Skeleton className="h-12 w-32 rounded-[8px]" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>

        {/* Activity + sidebar */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_300px]">
          <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-5 w-32" />
            <Skeleton className="mt-6 h-32 w-full" />
          </div>
          <div className="rounded-[12px] border border-[#d3cec6] bg-white p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-12" />
            <Skeleton className="mt-3 h-2 w-full" />
          </div>
        </div>

        {/* Roadmaps grid */}
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-5 w-32" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <RoadmapCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Progress page skeleton ─────────────────────────────────────────────────

export function ProgressSkeleton() {
  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 space-y-6 sm:space-y-8">

        <div>
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="mt-2 h-9 w-44" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>

        {/* XP hero */}
        <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Skeleton className="h-16 w-16 rounded-[12px]" />
            <div className="w-full sm:flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-2.5 w-full" />
            </div>
            <Skeleton className="h-14 w-28 rounded-[8px]" />
          </div>
        </div>

        {/* 5 stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>

        {/* Activity + score ring */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_200px]">
          <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-5 w-32" />
            <Skeleton className="mt-6 h-32 w-full" />
          </div>
          <div className="flex flex-col items-center justify-center gap-3 rounded-[12px] border border-[#d3cec6] bg-white p-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Assessment / Practice — shared centered-form skeleton ─────────────────

export function CenteredFormSkeleton() {
  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="mt-2 h-9 w-64" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />

        <div className="mt-8 rounded-[12px] border border-[#d3cec6] bg-white p-6 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-2.5 w-16" />
              <div className="mt-2.5 flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-7 w-20" />
                ))}
              </div>
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-[8px]" />
        </div>
      </div>
    </div>
  );
}

// ── Roadmap detail skeleton ────────────────────────────────────────────────

export function RoadmapDetailSkeleton() {
  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">

        <Skeleton className="h-4 w-32" />

        <div className="mt-6 rounded-[12px] border border-[#d3cec6] bg-white p-6">
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="mt-2 h-7 w-3/4" />
          <Skeleton className="mt-5 h-2 w-full" />
          <div className="mt-5 flex gap-6 border-t border-[#f5f1ec] pt-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="mt-1 h-5 w-8" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div>
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="mt-1 h-2.5 w-32" />
                </div>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="rounded-[10px] border border-[#d3cec6] bg-white p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="mt-1.5 h-2.5 w-full" />
                        <Skeleton className="mt-1 h-2.5 w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Chat message skeleton ──────────────────────────────────────────────────

export function ChatMessageSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <Skeleton className={`h-10 w-48 ${align === "right" ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`} />
    </div>
  );
}

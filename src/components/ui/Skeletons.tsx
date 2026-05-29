import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-gray-100", className)} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white p-6 shadow-sm", className)}>
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-3 w-1/2 mb-4" />
      <Skeleton className="h-2 w-full mb-2" />
      <Skeleton className="h-2 w-5/6 mb-4" />
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20 mt-1" />
    </div>
  );
}

export function RoadmapNodeSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-gray-100 bg-white p-4", className)}>
      <div className="flex items-start gap-2 mb-2">
        <Skeleton className="h-4 w-4 rounded shrink-0 mt-0.5" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-1.5" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function ChatMessageSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%]">
        <Skeleton className={`h-10 w-48 ${align === "right" ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`} />
      </div>
    </div>
  );
}

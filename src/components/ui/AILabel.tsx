"use client";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

export function AILabel({ className, compact = false }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700",
        compact && "px-1.5 py-px text-[10px]",
        className
      )}
    >
      <span aria-hidden>✦</span>
      {compact ? "AI" : "AI Generated"}
    </span>
  );
}

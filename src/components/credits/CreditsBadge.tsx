import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getBalance } from "@/lib/credits/credits";

/**
 * Server component — reads the live balance on every render so it stays honest
 * after an AI action spends credits.
 */
export async function CreditsBadge({ className = "" }: { className?: string }) {
  const user = await requireUser();
  const credits = await getBalance(user.id);
  const low = credits < 100;

  return (
    <Link
      href="/pricing"
      title={`${credits.toLocaleString()} credits — click to top up`}
      className={`flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
        low
          ? "border-[#ff5600] bg-[#fff1ea] text-[#ff5600] hover:bg-[#ffe4d6]"
          : "border-[#d3cec6] bg-white text-[#111111] hover:border-[#111111]"
      } ${className}`}
    >
      <span aria-hidden className="text-[11px]">✦</span>
      <span className="tabular-nums">{credits.toLocaleString()}</span>
      <span className="hidden text-[#9c9fa5] sm:inline">credits</span>
    </Link>
  );
}

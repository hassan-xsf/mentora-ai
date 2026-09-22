import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getBalance } from "@/lib/credits/credits";
import { getPack, packTotal } from "@/lib/credits/config";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ pack?: string }> };

export default async function PricingSuccessPage({ searchParams }: Props) {
  const { pack: packId } = await searchParams;
  const user = await requireUser();
  const credits = await getBalance(user.id);
  const pack = packId ? getPack(packId) : undefined;

  return (
    <div className="flex min-h-full items-center justify-center bg-[#f5f1ec] p-6">
      <div className="w-full max-w-sm rounded-[12px] border border-[#d3cec6] bg-white px-8 py-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f6ee] text-[20px] text-[#0f8a4a]">
          ✓
        </div>

        <h1 className="mt-5 text-[20px] font-medium text-[#111111]">Credits added</h1>

        <p className="mt-2 text-[14px] text-[#626260]">
          {pack
            ? `${packTotal(pack).toLocaleString()} credits from the ${pack.name} pack are now on your account.`
            : "Your credits are now on your account."}
        </p>

        <div className="mt-6 rounded-[10px] border border-[#d3cec6] bg-[#f5f1ec] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-[#9c9fa5]">New balance</p>
          <p className="text-[24px] font-medium tabular-nums text-[#111111]">
            {credits.toLocaleString()}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="flex h-10 items-center justify-center rounded-[8px] bg-[#111111] text-[13px] font-medium text-white transition-colors hover:bg-[#ff5600]"
          >
            Back to dashboard
          </Link>
          <Link
            href="/pricing"
            className="flex h-10 items-center justify-center rounded-[8px] border border-[#d3cec6] text-[13px] font-medium text-[#626260] transition-colors hover:border-[#111111] hover:text-[#111111]"
          >
            Buy more credits
          </Link>
        </div>
      </div>
    </div>
  );
}

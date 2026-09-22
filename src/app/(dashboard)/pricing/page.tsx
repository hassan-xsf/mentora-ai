import { requireUser } from "@/lib/auth/session";
import { getBalance, getTransactions } from "@/lib/credits/credits";
import {
  CREDIT_PACKS,
  CREDIT_COSTS,
  CREDIT_ACTION_LABELS,
  type CreditAction,
  formatPrice,
  packTotal,
} from "@/lib/credits/config";
import { buyCredits } from "@/app/actions/buy-credits";

export const dynamic = "force-dynamic";

function reasonLabel(reason: string): string {
  if (reason === "signup_bonus") return "Welcome bonus";
  if (reason.startsWith("purchase:")) return `Purchased ${reason.slice(9)} pack`;
  if (reason.startsWith("refund:")) return `Refund — ${CREDIT_ACTION_LABELS[reason.slice(7) as CreditAction] ?? reason.slice(7)}`;
  return CREDIT_ACTION_LABELS[reason as CreditAction] ?? reason;
}

export default async function PricingPage() {
  const user = await requireUser();
  const [credits, transactions] = await Promise.all([
    getBalance(user.id),
    getTransactions(user.id, 10),
  ]);

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">

        {/* Header + balance */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-medium tracking-tight text-[#111111]">Credits</h1>
            <p className="mt-1 text-[14px] text-[#626260]">
              Credits pay for AI work — roadmaps, challenges, evaluations and tutor chat.
            </p>
          </div>
          <div className="rounded-[10px] border border-[#d3cec6] bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-[#9c9fa5]">Your balance</p>
            <p className="text-[24px] font-medium tabular-nums text-[#111111]">
              {credits.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Packs */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative flex flex-col rounded-[12px] border bg-white p-6 shadow-sm ${
                pack.popular ? "border-[#ff5600]" : "border-[#d3cec6]"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-[#ff5600] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}

              <h2 className="text-[15px] font-medium text-[#111111]">{pack.name}</h2>

              <p className="mt-3 text-[30px] font-medium tracking-tight text-[#111111]">
                {formatPrice(pack.priceCents)}
              </p>

              <p className="mt-2 text-[14px] text-[#626260]">
                <span className="font-medium text-[#111111] tabular-nums">
                  {packTotal(pack).toLocaleString()}
                </span>{" "}
                credits
              </p>
              {pack.bonus > 0 && (
                <p className="mt-0.5 text-[12px] text-[#ff5600]">
                  includes {pack.bonus.toLocaleString()} bonus credits
                </p>
              )}

              <form action={buyCredits} className="mt-auto pt-6">
                <input type="hidden" name="packId" value={pack.id} />
                <button
                  type="submit"
                  className={`h-10 w-full rounded-[8px] text-[13px] font-medium transition-colors ${
                    pack.popular
                      ? "bg-[#ff5600] text-white hover:bg-[#e04c00]"
                      : "bg-[#111111] text-white hover:bg-[#ff5600]"
                  }`}
                >
                  Buy credits
                </button>
              </form>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[12px] text-[#9c9fa5]">
          Payments are not live yet — buying a pack credits your account immediately.
        </p>

        {/* Costs table */}
        <h2 className="mt-12 text-[15px] font-medium text-[#111111]">What things cost</h2>
        <div className="mt-3 overflow-hidden rounded-[10px] border border-[#d3cec6] bg-white shadow-sm">
          {(Object.keys(CREDIT_COSTS) as CreditAction[]).map((action, i) => (
            <div
              key={action}
              className={`flex items-center justify-between px-4 py-3 text-[13px] ${
                i > 0 ? "border-t border-[#ebe7e1]" : ""
              }`}
            >
              <span className="text-[#111111]">{CREDIT_ACTION_LABELS[action]}</span>
              <span className="tabular-nums text-[#626260]">
                {CREDIT_COSTS[action]} credits
              </span>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <h2 className="mt-12 text-[15px] font-medium text-[#111111]">Recent activity</h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-[13px] text-[#9c9fa5]">No credit activity yet.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-[10px] border border-[#d3cec6] bg-white shadow-sm">
            {transactions.map((tx, i) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between gap-4 px-4 py-3 text-[13px] ${
                  i > 0 ? "border-t border-[#ebe7e1]" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-[#111111]">{reasonLabel(tx.reason)}</p>
                  <p className="text-[11px] text-[#9c9fa5]">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`tabular-nums font-medium ${
                      tx.amount >= 0 ? "text-[#0f8a4a]" : "text-[#626260]"
                    }`}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[11px] tabular-nums text-[#9c9fa5]">
                    {tx.balance_after.toLocaleString()} left
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

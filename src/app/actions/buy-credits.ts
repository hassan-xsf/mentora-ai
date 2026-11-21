"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { addCredits } from "@/lib/credits/credits";
import { getPack, packTotal } from "@/lib/credits/config";
import { notify } from "@/lib/db/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { karachiDay } from "@/lib/gamification/streaks";

const DEMO_PURCHASES_PER_DAY = 3;

/**
 * Demo "purchase" of a credit pack. No payment provider is wired in, so the
 * credits are granted immediately, logged as `demo_purchase:<pack>` and capped
 * per Pakistan calendar day so the button can't be used as a credit faucet.
 * ponytail: swap the grant for a checkout session + webhook when a real
 * provider is wired in.
 */
export async function buyCredits(formData: FormData): Promise<void> {
  const user = await requireUser();
  const packId = String(formData.get("packId") ?? "");

  const pack = getPack(packId);
  if (!pack) throw new Error(`Unknown credit pack: ${packId}`);

  // shortcut: count-then-grant, two simultaneous clicks can exceed the cap by one;
  // fine for a demo cap, move into the add_credits RPC if real money is involved.
  const { count } = await createAdminClient()
    .from("credit_transactions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", user.id)
    .like("reason", "demo_purchase:%")
    .gte("created_at", `${karachiDay(new Date())}T00:00:00+05:00`);
  if ((count ?? 0) >= DEMO_PURCHASES_PER_DAY) redirect("/pricing/success?limited=1");

  const total = packTotal(pack);
  await addCredits(user.id, total, `demo_purchase:${pack.id}`);

  await notify(
    user.id,
    "credits",
    "Demo credits added ✦",
    `${total.toLocaleString()} demo credits from the ${pack.name} pack are in your balance. No payment was taken.`,
    "/pricing"
  );

  revalidatePath("/", "layout");
  redirect(`/pricing/success?pack=${pack.id}`);
}

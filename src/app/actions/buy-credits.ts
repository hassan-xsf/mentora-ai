"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { addCredits } from "@/lib/credits/credits";
import { getPack, packTotal } from "@/lib/credits/config";
import { notify } from "@/lib/db/notifications";

/**
 * "Purchase" a credit pack. No payment provider yet — the credits are granted
 * immediately and we redirect to the success page.
 * ponytail: no payment step, swap the grant for a checkout session + webhook
 * when a real provider is wired in.
 */
export async function buyCredits(formData: FormData): Promise<void> {
  const user = await requireUser();
  const packId = String(formData.get("packId") ?? "");

  const pack = getPack(packId);
  if (!pack) throw new Error(`Unknown credit pack: ${packId}`);

  const total = packTotal(pack);
  await addCredits(user.id, total, `purchase:${pack.id}`);

  await notify(
    user.id,
    "credits",
    "Credits added ✦",
    `${total.toLocaleString()} credits from the ${pack.name} pack are in your balance.`,
    "/pricing"
  );

  revalidatePath("/", "layout");
  redirect(`/pricing/success?pack=${pack.id}`);
}

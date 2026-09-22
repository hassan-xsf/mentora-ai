import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CREDIT_COSTS, CREDIT_ACTION_LABELS, type CreditAction } from "./config";

/** Thrown when a student can't afford an action. Callers surface `message` to the UI. */
export class InsufficientCreditsError extends Error {
  readonly code = "INSUFFICIENT_CREDITS";
  constructor(
    readonly action: CreditAction,
    readonly required: number,
    readonly balance: number
  ) {
    super(
      `${CREDIT_ACTION_LABELS[action]} costs ${required} credits — you have ${balance}. Top up on the Pricing page.`
    );
    this.name = "InsufficientCreditsError";
  }
}

export function isInsufficientCredits(err: unknown): err is InsufficientCreditsError {
  return err instanceof InsufficientCreditsError;
}

export async function getBalance(studentId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("credits")
    .eq("id", studentId)
    .single();
  return data?.credits ?? 0;
}

/**
 * Charge a student for an action. Atomic at the DB level — the balance check and
 * the decrement happen in one statement, so parallel requests can't overdraw.
 * Throws InsufficientCreditsError when they can't afford it.
 */
export async function spendCredits(
  studentId: string,
  action: CreditAction
): Promise<number> {
  const cost = CREDIT_COSTS[action];
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("spend_credits", {
    p_student_id: studentId,
    p_amount: cost,
    p_reason: action,
  });

  if (error) throw new Error(`Credit charge failed: ${error.message}`);
  if (data === null) {
    throw new InsufficientCreditsError(action, cost, await getBalance(studentId));
  }

  return data as number;
}

/** Give credits back when a charged action failed before delivering anything. */
export async function refundCredits(
  studentId: string,
  action: CreditAction
): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("add_credits", {
    p_student_id: studentId,
    p_amount: CREDIT_COSTS[action],
    p_reason: `refund:${action}`,
  });
}

export async function addCredits(
  studentId: string,
  amount: number,
  reason: string
): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("add_credits", {
    p_student_id: studentId,
    p_amount: amount,
    p_reason: reason,
  });
  if (error) throw new Error(`Credit grant failed: ${error.message}`);
  return data as number;
}

export type CreditTransaction = {
  id: string;
  amount: number;
  reason: string;
  balance_after: number;
  created_at: string;
};

export async function getTransactions(
  studentId: string,
  limit = 20
): Promise<CreditTransaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("credit_transactions")
    .select("id, amount, reason, balance_after, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as CreditTransaction[];
}

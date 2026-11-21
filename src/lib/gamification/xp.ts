import { createAdminClient } from "@/lib/supabase/admin";
import type { Difficulty } from "@/types";

export const XP_VALUES: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

/**
 * Atomic: the award_xp RPC increments students.xp_total and writes the
 * xp_events ledger row (used by the leaderboard) in one transaction.
 * Callers must have authenticated the user and decided the award is earned.
 * Returns the new total, or null when nothing was awarded.
 */
export async function awardXP(
  studentId: string,
  amount: number,
  reason = "unspecified"
): Promise<number | null> {
  if (!Number.isInteger(amount) || amount <= 0) return null;

  const { data, error } = await createAdminClient().rpc("award_xp", {
    p_student_id: studentId,
    p_amount: amount,
    p_reason: reason,
  });
  if (error) throw new Error(`XP award failed: ${error.message}`);
  return data;
}

import { createClient } from "@/lib/supabase/server";
import type { Difficulty } from "@/types";

export const XP_VALUES: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

export async function awardXP(studentId: string, amount: number): Promise<void> {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("xp_total")
    .eq("id", studentId)
    .single();

  if (student) {
    await supabase
      .from("students")
      .update({ xp_total: (student.xp_total ?? 0) + amount })
      .eq("id", studentId);
  } else {
    // Ensure student record exists
    await supabase
      .from("students")
      .upsert({ id: studentId, xp_total: amount, email: "" });
  }
}

import { createClient } from "@/lib/supabase/server";

export async function updateStreak(studentId: string): Promise<void> {
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("streak_count, last_active_date")
    .eq("id", studentId)
    .single();

  if (!student) return;

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const lastActive = student.last_active_date;

  if (lastActive === today) {
    // Already active today — no-op
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;
  if (lastActive === yesterdayStr) {
    // Consecutive day — increment
    newStreak = (student.streak_count ?? 0) + 1;
  } else {
    // Gap — reset
    newStreak = 1;
  }

  await supabase
    .from("students")
    .update({
      streak_count: newStreak,
      last_active_date: today,
    })
    .eq("id", studentId);
}

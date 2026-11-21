import { createAdminClient } from "@/lib/supabase/admin";

/** Calendar day (YYYY-MM-DD) in Pakistan, where our students are. */
export function karachiDay(now: Date): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(now);
}

function previousDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** New streak value, or null when the student was already active today. */
export function nextStreak(
  lastActive: string | null,
  current: number,
  today: string
): number | null {
  if (lastActive === today) return null;
  return lastActive === previousDay(today) ? current + 1 : 1;
}

export async function updateStreak(studentId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: student } = await supabase
    .from("students")
    .select("streak_count, last_active_date")
    .eq("id", studentId)
    .single();

  if (!student) return;

  const today = karachiDay(new Date());
  const streak = nextStreak(student.last_active_date, student.streak_count ?? 0, today);
  if (streak === null) return;

  // Guarded so two concurrent completions on the same day can't both increment.
  await supabase
    .from("students")
    .update({ streak_count: streak, last_active_date: today })
    .eq("id", studentId)
    .or(`last_active_date.is.null,last_active_date.neq.${today}`);
}

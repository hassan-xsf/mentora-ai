import { createClient } from "@/lib/supabase/server";

type BadgeDefinition = {
  name: string;
  description: string;
  icon: string;
  condition: (xp: number, challengeCount: number) => boolean;
};

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    name: "First Challenge",
    description: "Completed your first coding challenge",
    icon: "🎯",
    condition: (_, count) => count >= 1,
  },
  {
    name: "On Fire",
    description: "Completed 5 coding challenges",
    icon: "🔥",
    condition: (_, count) => count >= 5,
  },
  {
    name: "Century",
    description: "Earned 100 XP",
    icon: "💯",
    condition: (xp) => xp >= 100,
  },
  {
    name: "Dedicated",
    description: "Earned 500 XP",
    icon: "⭐",
    condition: (xp) => xp >= 500,
  },
  {
    name: "Expert",
    description: "Earned 1000 XP",
    icon: "🏆",
    condition: (xp) => xp >= 1000,
  },
];

export async function checkAndAwardBadges(studentId: string): Promise<string[]> {
  const supabase = await createClient();

  const [studentResult, challengeCountResult, existingBadgesResult] = await Promise.all([
    supabase.from("students").select("xp_total").eq("id", studentId).single(),
    supabase
      .from("coding_challenges")
      .select("id", { count: "exact" })
      .eq("student_id", studentId)
      .eq("status", "evaluated"),
    supabase.from("badges").select("name").eq("student_id", studentId),
  ]);

  const xp = studentResult.data?.xp_total ?? 0;
  const challengeCount = challengeCountResult.count ?? 0;
  const existingBadgeNames = new Set(
    (existingBadgesResult.data ?? []).map((b) => b.name)
  );

  const newlyAwarded: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (!existingBadgeNames.has(badge.name) && badge.condition(xp, challengeCount)) {
      await supabase.from("badges").insert({
        student_id: studentId,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      });
      newlyAwarded.push(badge.name);
    }
  }

  return newlyAwarded;
}

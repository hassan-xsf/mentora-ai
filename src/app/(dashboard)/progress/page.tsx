import { requireUser } from "@/lib/auth/session";
import { getProgressRecord, getActivityData } from "@/lib/db/progress";
import { getStudentBadges, getStudentProfile } from "@/lib/db/practice";
import { ActivityChart } from "@/components/progress/ActivityChart";
import { ProgressEmptyState } from "@/components/progress/ProgressEmptyState";
import type { Badge, ProgressRecord } from "@/types";

// ─── XP helpers ───────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 100;

function xpLevel(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const progress = xp % XP_PER_LEVEL;
  return { level, progress, next: XP_PER_LEVEL };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[12px] border px-5 py-4 ${
        accent ? "border-[#111111] bg-[#111111]" : "border-[#d3cec6] bg-white"
      }`}
    >
      <p className={`text-[11px] font-medium uppercase tracking-widest ${accent ? "text-white/40" : "text-[#9c9fa5]"}`}>
        {label}
      </p>
      <p className={`mt-1.5 text-[26px] font-medium tracking-[-0.5px] leading-none ${accent ? "text-white" : "text-[#111111]"}`}>
        {value}
      </p>
      {sub && (
        <p className={`mt-1 text-[12px] ${accent ? "text-white/40" : "text-[#9c9fa5]"}`}>{sub}</p>
      )}
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-[#d3cec6] bg-white p-4">
      <span className="text-[28px] leading-none shrink-0">{badge.icon}</span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#111111]">{badge.name}</p>
        <p className="mt-0.5 text-[12px] text-[#9c9fa5]">{badge.description}</p>
        <p className="mt-1.5 text-[10px] text-[#9c9fa5]">
          {new Date(badge.awarded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={80} height={80} className="shrink-0" aria-hidden>
      <circle cx={40} cy={40} r={r} fill="none" stroke="#ebe7e1" strokeWidth={6} />
      <circle
        cx={40}
        cy={40}
        r={r}
        fill="none"
        stroke={score >= 70 ? "#0bdf50" : "#ff5600"}
        strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x={40} y={45} textAnchor="middle" fontSize={14} fontWeight={500} fill="#111111">
        {score}%
      </text>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const user = await requireUser();

  const [progress, activityData, badges, profile] = await Promise.all([
    getProgressRecord(user.id),
    getActivityData(user.id, 30),
    getStudentBadges(user.id),
    getStudentProfile(user.id),
  ]);

  const hasData =
    progress.nodes_completed > 0 ||
    progress.coding_challenges_completed > 0 ||
    progress.milestone_tests_taken > 0;

  const { level, progress: xpProgress, next } = xpLevel(profile.xp_total);
  const xpPct = Math.round((xpProgress / next) * 100);
  const activeDays = activityData.filter(
    (d) => d.challenges_completed > 0 || d.nodes_completed > 0
  ).length;

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* Page header */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Analytics</p>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-medium leading-[1.15] tracking-[-0.8px] text-[#111111]">
            My Progress
          </h1>
          <p className="mt-1.5 text-[15px] text-[#626260]">
            Track your learning journey, streaks, and achievements.
          </p>
        </div>

        {!hasData ? (
          <ProgressEmptyState />
        ) : (
          <>
            {/* XP + Level hero card */}
            <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                {/* Level number */}
                <div className="flex h-16 w-16 items-center justify-center rounded-[12px] bg-[#111111] shrink-0">
                  <div className="text-center">
                    <p className="text-[9px] font-medium uppercase tracking-widest text-white/40">Lvl</p>
                    <p className="text-[22px] font-medium leading-none text-white">{level}</p>
                  </div>
                </div>

                {/* XP bar */}
                <div className="w-full sm:flex-1 sm:min-w-40">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[15px] font-medium text-[#111111]">
                      {profile.xp_total.toLocaleString()} XP
                    </p>
                    <p className="text-[12px] text-[#9c9fa5]">
                      {xpProgress} / {next} to Level {level + 1}
                    </p>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#ebe7e1]">
                    <div
                      className="h-full rounded-full bg-[#111111] transition-all"
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-3 rounded-[8px] border border-[#d3cec6] bg-[#f5f1ec] px-4 py-3">
                  <span className="text-[24px]" aria-hidden>🔥</span>
                  <div>
                    <p className="text-[20px] font-medium leading-none tracking-[-0.3px] text-[#111111]">
                      {profile.streak_count}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#9c9fa5]">day streak</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard
                label="Roadmaps"
                value={progress.roadmaps_completed}
                sub="completed"
              />
              <StatCard
                label="Nodes"
                value={progress.nodes_completed}
                sub="completed"
              />
              <StatCard
                label="Tests taken"
                value={progress.milestone_tests_taken}
                sub="milestones"
              />
              <StatCard
                label="Challenges"
                value={progress.coding_challenges_completed}
                sub="solved"
              />
              <StatCard
                label="Avg score"
                value={progress.milestone_tests_taken > 0 ? `${Math.round(progress.milestone_tests_avg_score)}%` : "—"}
                sub="test average"
                accent
              />
            </div>

            {/* Activity chart + score ring */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_200px]">
              <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Activity</p>
                    <h2 className="mt-0.5 text-[18px] font-medium tracking-[-0.2px] text-[#111111]">
                      Last 30 days
                    </h2>
                  </div>
                  <span className="rounded-[6px] bg-[#f5f1ec] px-2.5 py-1 text-[12px] font-medium text-[#626260]">
                    {activeDays} active days
                  </span>
                </div>
                <ActivityChart activityData={activityData} />
              </div>

              {/* Score ring card */}
              {progress.milestone_tests_taken > 0 && (
                <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6 flex flex-col items-center justify-center gap-4">
                  <ScoreRing score={Math.round(progress.milestone_tests_avg_score)} />
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-[#111111]">Avg test score</p>
                    <p className="mt-0.5 text-[12px] text-[#9c9fa5]">
                      {progress.milestone_tests_taken} test{progress.milestone_tests_taken !== 1 ? "s" : ""}
                    </p>
                    <p className={`mt-1.5 text-[11px] font-medium ${progress.milestone_tests_avg_score >= 70 ? "text-[#0bdf50]" : "text-[#ff5600]"}`}>
                      {progress.milestone_tests_avg_score >= 70 ? "Passing ✓" : "Keep going →"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Achievements</p>
                    <h2 className="mt-0.5 text-[18px] font-medium tracking-[-0.2px] text-[#111111]">
                      Badges earned
                    </h2>
                  </div>
                  <span className="rounded-[4px] bg-[#f5f1ec] px-2 py-0.5 text-[11px] font-medium text-[#626260]">
                    {badges.length} / 5
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {badges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

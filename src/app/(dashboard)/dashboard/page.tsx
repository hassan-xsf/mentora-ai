import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getRoadmapsByStudent } from "@/lib/db/roadmaps";
import { getProgressRecord, getActivityData } from "@/lib/db/progress";
import { getStudentProfile, getStudentBadges } from "@/lib/db/practice";
import { ActivityChart } from "@/components/progress/ActivityChart";
import type { Roadmap, Badge, ActivityDataPoint, ProgressRecord } from "@/types";

// ─── XP level helpers ─────────────────────────────────────────────────────────

const XP_PER_LEVEL = 100;

function xpLevel(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const progress = xp % XP_PER_LEVEL;
  return { level, progress, next: XP_PER_LEVEL };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function XPBar({ xp, streak }: { xp: number; streak: number }) {
  const { level, progress, next } = xpLevel(xp);
  const pct = Math.round((progress / next) * 100);

  return (
    <div className="rounded-[12px] border border-[#d3cec6] bg-white px-6 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        {/* Level badge */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#111111] text-white">
            <span className="text-[11px] font-medium leading-none text-white/50">LVL</span>
          </div>
          <div>
            <p className="text-[22px] font-medium tracking-[-0.3px] text-[#111111]">
              Level {level}
            </p>
            <p className="text-[12px] text-[#9c9fa5]">
              {xp.toLocaleString()} XP total
            </p>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="w-full sm:flex-1 sm:min-w-40 sm:max-w-xs">
          <div className="mb-1.5 flex justify-between text-[11px] text-[#9c9fa5]">
            <span>{progress} / {next} XP</span>
            <span>{pct}% to Lv {level + 1}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#ebe7e1]">
            <div
              className="h-full rounded-full bg-[#111111] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2.5 rounded-[8px] border border-[#d3cec6] bg-[#f5f1ec] px-4 py-2.5">
          <span className="text-[20px]" aria-hidden>🔥</span>
          <div>
            <p className="text-[18px] font-medium leading-none tracking-[-0.2px] text-[#111111]">
              {streak}
            </p>
            <p className="mt-0.5 text-[11px] text-[#9c9fa5]">day streak</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        accent
          ? "border-[#111111] bg-[#111111]"
          : "border-[#d3cec6] bg-white"
      }`}
    >
      <p className={`text-[11px] font-medium uppercase tracking-widest ${accent ? "text-white/40" : "text-[#9c9fa5]"}`}>
        {label}
      </p>
      <p className={`mt-1.5 text-[26px] font-medium tracking-[-0.5px] leading-none ${accent ? "text-white" : "text-[#111111]"}`}>
        {value}
      </p>
      {sub && (
        <p className={`mt-1 text-[12px] ${accent ? "text-white/40" : "text-[#9c9fa5]"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

function RoadmapCard({ roadmap }: { roadmap: Roadmap }) {
  const pct = roadmap.completion_percentage;
  return (
    <div className="group flex flex-col rounded-[12px] border border-[#d3cec6] bg-white p-6 transition-shadow hover:shadow-[0_2px_16px_rgba(17,17,17,0.06)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-medium leading-snug tracking-[-0.2px] text-[#111111] truncate">
            {roadmap.title}
          </h3>
          <p className="mt-0.5 text-[11px] text-[#9c9fa5]">
            {new Date(roadmap.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <span className="shrink-0 rounded-[4px] bg-[#f5f1ec] px-2 py-0.5 text-[11px] font-medium text-[#626260]">
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ebe7e1]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct === 100 ? "#0bdf50" : "#111111" }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[#9c9fa5]">
          {pct === 0 ? "Not started" : pct === 100 ? "Completed ✓" : `${pct}% complete`}
        </p>
      </div>

      <Link
        href={`/roadmap/${roadmap.id}`}
        className="mt-auto flex h-9 w-full items-center justify-center rounded-[8px] bg-[#111111] text-[13px] font-medium text-white transition-colors hover:bg-black"
      >
        {pct === 0 ? "Start" : pct === 100 ? "Review" : "Continue"}
      </Link>
    </div>
  );
}

function BadgeChip({ badge }: { badge: Badge }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[8px] border border-[#d3cec6] bg-white px-3.5 py-2.5">
      <span className="text-[20px] leading-none">{badge.icon}</span>
      <div>
        <p className="text-[12px] font-medium text-[#111111]">{badge.name}</p>
        <p className="text-[11px] text-[#9c9fa5]">{badge.description}</p>
      </div>
    </div>
  );
}

// ─── Inline mini chart (last 14 days) ────────────────────────────────────────

function MiniChart({ data }: { data: ActivityDataPoint[] }) {
  const last14 = data.slice(-14);
  const maxActivity = Math.max(...last14.map((d) => d.challenges_completed + d.nodes_completed), 1);
  const H = 48;

  return (
    <svg width="100%" viewBox={`0 0 ${last14.length * 14} ${H + 16}`} preserveAspectRatio="none" aria-hidden>
      {last14.map((pt, i) => {
        const actTotal = pt.challenges_completed + pt.nodes_completed;
        const h = Math.max(2, Math.round((actTotal / maxActivity) * H));
        return (
          <g key={pt.date}>
            <rect
              x={i * 14}
              y={H - h}
              width={10}
              height={h}
              fill={actTotal > 0 ? "#111111" : "#ebe7e1"}
              rx={2}
            />
            {i % 7 === 0 && (
              <text x={i * 14 + 5} y={H + 14} fontSize={7} fill="#9c9fa5" textAnchor="middle">
                {pt.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await requireUser();

  const [roadmaps, profile, progress, activityData, badges] = await Promise.all([
    getRoadmapsByStudent(user.id),
    getStudentProfile(user.id),
    getProgressRecord(user.id),
    getActivityData(user.id, 30),
    getStudentBadges(user.id),
  ]);

  const firstName = profile.full_name?.split(" ")[0] ?? "there";
  const activeDays = activityData.filter((d) => d.challenges_completed > 0 || d.nodes_completed > 0).length;

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* Page header */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Overview</p>
          <h1 className="mt-1 text-[26px] sm:text-[32px] font-medium leading-[1.15] tracking-[-0.8px] text-[#111111]">
            Hey, {firstName} 👋
          </h1>
          <p className="mt-1.5 text-[15px] text-[#626260]">
            Here&rsquo;s where you stand across all your roadmaps.
          </p>
        </div>

        {/* XP + Streak bar */}
        <XPBar xp={profile.xp_total} streak={profile.streak_count} />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Roadmaps"
            value={roadmaps.length}
            sub={`${roadmaps.filter((r) => r.completion_percentage === 100).length} completed`}
          />
          <StatCard
            label="Nodes done"
            value={progress.nodes_completed}
            sub="learning topics"
          />
          <StatCard
            label="Challenges"
            value={progress.coding_challenges_completed}
            sub="coding problems"
          />
          <StatCard
            label="Avg score"
            value={progress.milestone_tests_taken > 0 ? `${Math.round(progress.milestone_tests_avg_score)}%` : "—"}
            sub="milestone tests"
            accent
          />
        </div>

        {/* Activity + sidebar — two-column layout on lg */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_300px]">

          {/* Left: Activity chart */}
          <div className="rounded-[12px] border border-[#d3cec6] bg-white p-6">
            <div className="mb-1 flex items-center justify-between">
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
            <div className="mt-5">
              <ActivityChart activityData={activityData} />
            </div>
          </div>

          {/* Right: Quick stats */}
          <div className="flex flex-col gap-4">
            {/* Tests card */}
            <div className="rounded-[12px] border border-[#d3cec6] bg-white p-5">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Milestone tests</p>
              <p className="mt-1.5 text-[28px] font-medium tracking-[-0.5px] text-[#111111]">
                {progress.milestone_tests_taken}
                <span className="ml-1 text-[14px] font-normal text-[#9c9fa5]">taken</span>
              </p>
              {progress.milestone_tests_taken > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px] text-[#9c9fa5]">
                    <span>Average score</span>
                    <span>{Math.round(progress.milestone_tests_avg_score)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ebe7e1]">
                    <div
                      className="h-full rounded-full bg-[#0bdf50] transition-all"
                      style={{ width: `${progress.milestone_tests_avg_score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
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
                {badges.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => (
                <BadgeChip key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        )}

        {/* Roadmaps section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Learning paths</p>
              <h2 className="mt-0.5 text-[18px] font-medium tracking-[-0.2px] text-[#111111]">
                My roadmaps
              </h2>
            </div>
            <Link
              href="/assessment"
              className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#d3cec6] bg-white px-3 text-[12px] font-medium text-[#626260] transition-colors hover:bg-[#f5f1ec] hover:text-[#111111]"
            >
              <span>+ New</span>
            </Link>
          </div>

          {roadmaps.length === 0 ? (
            <div className="rounded-[16px] border border-[#d3cec6] bg-white px-5 py-10 sm:px-8 sm:py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#f5f1ec] text-xl">
                🗺️
              </div>
              <h3 className="text-[18px] font-medium tracking-[-0.2px] text-[#111111]">
                No roadmaps yet
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-[#626260]">
                Take the career assessment to get AI-generated learning roadmaps.
              </p>
              <Link
                href="/assessment"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#ff5600] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#e04d00]"
              >
                Start Career Assessment →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roadmaps.map((roadmap) => (
                <RoadmapCard key={roadmap.id} roadmap={roadmap} />
              ))}
              <Link
                href="/assessment"
                className="flex flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#d3cec6] px-6 py-10 text-center transition-colors hover:border-[#111111] hover:bg-white group"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d3cec6] text-[18px] text-[#9c9fa5] transition-colors group-hover:border-[#111111] group-hover:text-[#111111]">
                  +
                </span>
                <span className="text-[13px] font-medium text-[#9c9fa5] transition-colors group-hover:text-[#111111]">
                  New roadmap
                </span>
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

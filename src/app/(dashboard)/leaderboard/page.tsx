import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VisibilityToggle } from "./VisibilityToggle";

const PERIODS = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
] as const;
type Period = (typeof PERIODS)[number]["key"];

const TOP_N = 20;

type Props = { searchParams: Promise<{ period?: string }> };

export default async function LeaderboardPage({ searchParams }: Props) {
  const user = await requireUser();
  const { period: raw } = await searchParams;
  const period: Period = PERIODS.some((p) => p.key === raw) ? (raw as Period) : "week";

  const supabase = await createClient();
  const [{ data: rows, error }, { data: me }] = await Promise.all([
    createAdminClient().rpc("get_leaderboard", {
      p_period: period,
      p_viewer: user.id,
      p_limit: TOP_N,
    }),
    supabase.from("students").select("show_on_leaderboard").eq("id", user.id).single(),
  ]);

  const ranked = (rows ?? []).filter((r) => r.rank !== null);
  const top = ranked.slice(0, TOP_N);
  const mine = (rows ?? []).find((r) => r.is_me);
  const mineInTop = top.some((r) => r.is_me);
  const visible = me?.show_on_leaderboard ?? true;

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Community</p>
          <h1 className="mt-1 text-[28px] font-medium leading-tight tracking-[-0.5px] text-[#111111]">
            Leaderboard
          </h1>
          <p className="mt-2 text-[13px] text-[#626260]">
            Ranked by XP earned from challenges, topics and tests. Weeks start Monday, Pakistan time.
          </p>
        </div>

        <nav className="inline-flex rounded-full border border-[#d3cec6] bg-white p-0.5" aria-label="Period">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/leaderboard?period=${p.key}`}
              aria-current={p.key === period ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors ${
                p.key === period ? "bg-[#111111] text-white" : "text-[#626260] hover:text-[#111111]"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        {mine && (
          <div className="flex items-center gap-4 rounded-[12px] border border-[#111111] bg-[#111111] px-5 py-4 text-white">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-white/40">Your rank</p>
              <p className="mt-1 text-[26px] font-medium leading-none tracking-[-0.5px]">
                {mine.rank !== null ? `#${mine.rank}` : "—"}
              </p>
            </div>
            <p className="ml-auto text-right text-[12.5px] text-white/60">
              {!visible
                ? "You're hidden, so you aren't ranked."
                : mine.rank === null
                  ? "Earn XP this period to get ranked."
                  : `${mine.xp.toLocaleString()} XP${mine.rank === 1 ? " · top of the board" : ""}`}
            </p>
          </div>
        )}

        {error ? (
          <p className="rounded-[12px] border border-[#d3cec6] bg-white px-5 py-8 text-center text-[13px] text-[#9c9fa5]">
            The leaderboard is unavailable right now. Try again in a moment.
          </p>
        ) : top.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#d3cec6] bg-white px-6 py-12 text-center">
            <p className="text-[15px] font-medium text-[#111111]">Nobody has earned XP yet</p>
            <p className="mt-1 text-[13px] text-[#9c9fa5]">Solve a practice challenge to claim the top spot.</p>
          </div>
        ) : (
          <ol className="overflow-hidden rounded-[12px] border border-[#d3cec6] bg-white">
            {top.map((r, i) => (
              <Row key={i} row={r} />
            ))}
            {mine && !mineInTop && mine.rank !== null && (
              <>
                <li className="border-t border-[#ebe7e1] px-5 py-1 text-center text-[12px] text-[#9c9fa5]" aria-hidden>
                  ⋯
                </li>
                <Row row={mine} />
              </>
            )}
          </ol>
        )}

        <VisibilityToggle initial={visible} />
      </div>
    </div>
  );
}

type LeaderRow = {
  rank: number | null;
  display_name: string;
  avatar_initial: string;
  xp: number;
  streak: number;
  is_me: boolean;
};

function Row({ row }: { row: LeaderRow }) {
  const medal = row.rank === 1 ? "#ff5600" : row.rank === 2 ? "#626260" : row.rank === 3 ? "#b3ada3" : null;
  return (
    <li
      className={`flex items-center gap-3 border-t border-[#ebe7e1] px-5 py-3 first:border-t-0 ${
        row.is_me ? "bg-[#fff1ea]" : ""
      }`}
    >
      <span
        className="w-8 shrink-0 text-[13px] font-semibold tabular-nums"
        style={{ color: medal ?? "#9c9fa5" }}
      >
        #{row.rank}
      </span>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
        style={{ background: medal ?? "#111111" }}
        aria-hidden
      >
        {row.avatar_initial}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[#111111]">
        {row.display_name}
        {row.is_me && <span className="ml-1.5 text-[11px] font-medium text-[#ff5600]">You</span>}
      </span>
      {row.streak > 0 && (
        <span className="hidden text-[12px] text-[#9c9fa5] sm:inline" title={`${row.streak} day streak`}>
          🔥 {row.streak}
        </span>
      )}
      <span className="w-20 shrink-0 text-right text-[13px] font-semibold tabular-nums text-[#111111]">
        {row.xp.toLocaleString()} XP
      </span>
    </li>
  );
}

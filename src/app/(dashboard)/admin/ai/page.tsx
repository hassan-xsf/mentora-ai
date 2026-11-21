import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { loadEvaluation, WINDOW_DAYS, CHART_DAYS } from "./data";

export const metadata: Metadata = { title: "AI evaluation · Admin" };
export const dynamic = "force-dynamic";

const pct = (r: number | null) => (r === null ? "—" : `${Math.round(r * 1000) / 10}%`);
const ms = (n: number | null) => (n === null ? "—" : n < 1000 ? `${n} ms` : `${(n / 1000).toFixed(1)} s`);
const num = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#d3cec6] bg-white px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">{label}</p>
      <p className="mt-1.5 text-[26px] font-medium leading-none tracking-[-0.5px] text-[#111111]">{value}</p>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[12px] border border-[#d3cec6] bg-white">
      <div className="flex items-center justify-between border-b border-[#ebe7e1] px-5 py-3">
        <h2 className="text-[14px] font-medium text-[#111111]">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-[13px] text-[#9c9fa5]">{children}</p>;
}

function VolumeChart({ days }: { days: { day: string; ok: number; failed: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.ok + d.failed));
  const W = 28;
  const GAP = 8;
  const H = 120;
  const total = days.reduce((s, d) => s + d.ok + d.failed, 0);
  if (total === 0) return <Empty>No AI calls in the last {CHART_DAYS} days.</Empty>;
  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label={`AI calls per day for the last ${CHART_DAYS} days, ${total} in total`}
        width={days.length * (W + GAP)}
        height={H + 34}
        className="block"
      >
        {days.map((d, i) => {
          const x = i * (W + GAP);
          const okH = (d.ok / max) * H;
          const failH = (d.failed / max) * H;
          const label = d.day.slice(8); // day of month
          return (
            <g key={d.day}>
              <title>{`${d.day}: ${d.ok} ok, ${d.failed} failed`}</title>
              <rect x={x} y={H - okH} width={W} height={okH} rx={3} fill="#111111" />
              {d.failed > 0 && <rect x={x} y={H - okH - failH} width={W} height={failH} rx={3} fill="#ff5600" />}
              {d.ok + d.failed > 0 && (
                <text x={x + W / 2} y={H - okH - failH - 4} textAnchor="middle" fontSize={10} fill="#626260">
                  {d.ok + d.failed}
                </text>
              )}
              <text x={x + W / 2} y={H + 16} textAnchor="middle" fontSize={10} fill="#9c9fa5">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-[11px] text-[#626260]">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px] bg-[#111111]" />Succeeded</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px] bg-[#ff5600]" />Failed</span>
      </div>
    </div>
  );
}

export default async function AdminAIPage() {
  await requireAdmin();
  const data = await loadEvaluation();
  const th = "px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#9c9fa5] whitespace-nowrap";
  const td = "px-3 py-2.5 text-[13px] text-[#111111] whitespace-nowrap tabular-nums";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-widest text-[#ff5600]">Admin</p>
        <h1 className="mt-1 text-[28px] font-medium tracking-[-0.5px] text-[#111111]">AI evaluation</h1>
        <p className="mt-1 text-[14px] text-[#626260]">
          Reliability, latency and student feedback for every AI feature — last {WINDOW_DAYS} days
          {data.eventCount > 0 && ` · ${data.eventCount.toLocaleString("en-US")} logged events`}.
        </p>
      </div>

      {data.tablesMissing && (
        <div role="status" className="rounded-[8px] border border-[#d3cec6] bg-[#ebe7e1] px-4 py-3 text-[13px] text-[#111111]">
          Telemetry tables are not available yet. Apply <code className="font-mono text-[12px]">supabase/migrations/010_ai_evaluation.sql</code> to start collecting data.
        </div>
      )}
      {data.truncated && (
        <p className="text-[12px] text-[#7b7b78]">Showing the most recent 20,000 events of the window.</p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Students" value={num(data.totals.students)} />
        <Stat label="Roadmaps" value={num(data.totals.roadmaps)} />
        <Stat label="Challenges evaluated" value={num(data.totals.challengesEvaluated)} />
        <Stat label="Tests passed" value={num(data.totals.testsPassed)} />
        <Stat label="Certificates" value={num(data.totals.certificates)} />
      </div>

      <Card
        title="Per feature"
        action={
          <a
            href="/admin/ai/export"
            className="rounded-[8px] border border-[#d3cec6] px-3 py-1.5 text-[12px] font-medium text-[#111111] hover:border-[#111111]"
          >
            Export CSV
          </a>
        }
      >
        {data.features.length === 0 ? (
          <Empty>No AI activity recorded yet.</Empty>
        ) : (
          <div className="-m-5 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b border-[#ebe7e1] bg-[#f5f1ec]">
                <tr>
                  <th className={th}>Feature</th>
                  <th className={th}>Calls</th>
                  <th className={th}>Success</th>
                  <th className={th}>Fallback</th>
                  <th className={th}>p50</th>
                  <th className={th}>p95</th>
                  <th className={th}>Avg prompt</th>
                  <th className={th}>Avg reply</th>
                  <th className={th}>Thumbs up</th>
                  <th className={th}>Credits</th>
                </tr>
              </thead>
              <tbody>
                {data.features.map((f) => (
                  <tr key={f.feature} className="border-b border-[#ebe7e1] last:border-0">
                    <td className={`${td} font-mono text-[12px]`}>{f.feature}</td>
                    <td className={td}>{num(f.calls)}</td>
                    <td className={td}>{pct(f.successRate)}</td>
                    <td className={td}>{pct(f.fallbackRate)} <span className="text-[#9c9fa5]">({f.fallbacks})</span></td>
                    <td className={td}>{ms(f.p50)}</td>
                    <td className={td}>{ms(f.p95)}</td>
                    <td className={td}>{f.avgPromptChars === null ? "—" : `${num(f.avgPromptChars)} ch`}</td>
                    <td className={td}>{f.avgResponseChars === null ? "—" : `${num(f.avgResponseChars)} ch`}</td>
                    <td className={td}>{pct(f.thumbsUpRate)} <span className="text-[#9c9fa5]">({f.feedbackCount})</span></td>
                    <td className={td}>{num(f.creditsSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.features.length > 0 && (
          <p className="mt-8 text-[11px] text-[#9c9fa5]">
            Success = calls that returned a reply (after at most one retry). Fallback = times canned content was served instead,
            relative to calls. Latency percentiles use successful calls. Credits = charges minus refunds.
          </p>
        )}
      </Card>

      <Card title={`Daily AI calls · last ${CHART_DAYS} days`}>
        <VolumeChart days={data.daily} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent failures">
          {data.failures.length === 0 ? (
            <Empty>No failures recorded.</Empty>
          ) : (
            <ul className="divide-y divide-[#ebe7e1]">
              {data.failures.map((e) => (
                <li key={e.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="font-mono text-[#111111]">
                      {e.feature}
                      <span className="ml-2 rounded-[4px] bg-[#ebe7e1] px-1.5 py-px font-sans text-[10px] uppercase text-[#626260]">{e.kind}</span>
                    </span>
                    <span className="shrink-0 text-[#9c9fa5]">{when(e.created_at)}</span>
                  </div>
                  {e.error && <p className="mt-1 line-clamp-2 break-words text-[12px] text-[#626260]">{e.error}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent negative feedback">
          {data.negative.length === 0 ? (
            <Empty>No negative feedback yet.</Empty>
          ) : (
            <ul className="divide-y divide-[#ebe7e1]">
              {data.negative.map((f) => (
                <li key={f.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="font-mono text-[#111111]">{f.feature}</span>
                    <span className="shrink-0 text-[#9c9fa5]">{when(f.created_at)}</span>
                  </div>
                  <p className="mt-1 break-words text-[12px] text-[#626260]">
                    {f.comment ?? <span className="italic text-[#9c9fa5]">No comment</span>}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-[#9c9fa5]">target {f.target_id}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

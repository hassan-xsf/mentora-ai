import type { DayPoint } from "./series";

type Props = {
  data: DayPoint[];
  color?: string;
  /** Formats a value for the tooltip, e.g. minutes -> "1h 5m". */
  format: (value: number) => string;
  label: string;
};

/** Responsive daily bar chart, one bar per Pakistan day. */
export function DailyBars({ data, color = "#111111", format, label }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const H = 100;
  const barW = 10;
  const gap = 4;
  const W = data.length * (barW + gap) - gap;
  const labelEvery = Math.ceil(data.length / 7);

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="block h-auto w-full" role="img" aria-label={label}>
      {[0.5, 1].map((r) => (
        <line key={r} x1={0} x2={W} y1={H - r * H} y2={H - r * H} stroke="#ebe7e1" strokeWidth={0.5} />
      ))}
      {data.map((d, i) => {
        const x = i * (barW + gap);
        const h = Math.round((d.value / max) * H);
        return (
          <g key={d.date}>
            <rect x={x} y={h > 0 ? H - h : H - 1.5} width={barW} height={h > 0 ? h : 1.5} rx={1.5} fill={h > 0 ? color : "#ebe7e1"}>
              <title>{`${d.date}: ${format(d.value)}`}</title>
            </rect>
            {(data.length - 1 - i) % labelEvery === 0 && (
              <text x={x + barW / 2} y={H + 13} textAnchor="middle" fontSize={7} fill="#9c9fa5">
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

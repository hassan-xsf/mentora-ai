import type { DayPoint } from "./series";

type Props = {
  data: DayPoint[];
  color?: string;
  /** Formats a value for the tooltip, e.g. minutes -> "1h 5m". */
  format: (value: number) => string;
  label: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDay = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

/** Daily bar chart, one bar per Pakistan day. HTML bars so height and text stay fixed at any width. */
export function DailyBars({ data, color = "#111111", format, label }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const labelEvery = Math.ceil(data.length / 7);

  return (
    <figure role="img" aria-label={label} className="w-full">
      <div className="relative flex h-32 items-end gap-[3px] border-b border-[#ebe7e1] sm:gap-1.5">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-[#efebe5]" />
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={d.date}
              title={`${shortDay(d.date)}: ${format(d.value)}`}
              className="relative flex h-full flex-1 items-end justify-center"
            >
              <div
                className="w-full max-w-7 rounded-t-[4px] transition-[height]"
                style={{ height: d.value > 0 ? `max(${pct}%, 4px)` : "2px", background: d.value > 0 ? color : "#ebe7e1" }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] sm:gap-1.5" aria-hidden>
        {data.map((d, i) => (
          <span key={d.date} className="flex-1 whitespace-nowrap text-center text-[10.5px] tabular-nums text-[#9c9fa5]">
            {(data.length - 1 - i) % labelEvery === 0 ? shortDay(d.date) : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}

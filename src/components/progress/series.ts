/** Calendar day (YYYY-MM-DD) in Pakistan for a timestamp. */
export function pkDay(at: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date(at));
}

function shiftDay(day: string, by: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + by);
  return d.toISOString().slice(0, 10);
}

export type DayPoint = { date: string; value: number };

/** Sums values per Pakistan day over the `days` days ending today, zero-filled. */
export function dailySeries(
  rows: { at: string; value: number }[],
  days: number,
  now = new Date()
): DayPoint[] {
  const today = pkDay(now);
  const series = Array.from({ length: days }, (_, i) => ({ date: shiftDay(today, i - days + 1), value: 0 }));
  const index = new Map(series.map((p, i) => [p.date, i]));
  for (const r of rows) {
    const i = index.get(pkDay(r.at));
    if (i !== undefined) series[i].value += r.value;
  }
  return series;
}

/** Monday of the Pakistan week containing `day`. */
export function weekStart(day: string): string {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return shiftDay(day, -((dow + 6) % 7));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

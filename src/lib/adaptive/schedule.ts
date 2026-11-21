/**
 * Spaced repetition, SM-2-lite: a fixed interval ladder. A correct review moves
 * one rung up, a wrong one drops back to the bottom.
 */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;
export const MAX_STAGE = REVIEW_INTERVALS.length - 1;

/** YYYY-MM-DD plus n calendar days. */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Where an item goes after being reviewed on `today`. */
export function nextReview(
  stage: number,
  correct: boolean,
  today: string
): { stage: number; dueDate: string; lapsed: boolean } {
  if (!correct) return { stage: 0, dueDate: addDays(today, REVIEW_INTERVALS[0]), lapsed: true };
  const current = Math.min(Math.max(stage, 0), MAX_STAGE);
  const next = Math.min(current + 1, MAX_STAGE);
  return { stage: next, dueDate: addDays(today, REVIEW_INTERVALS[current]), lapsed: false };
}

export function isDue(dueDate: string, today: string): boolean {
  return dueDate <= today;
}

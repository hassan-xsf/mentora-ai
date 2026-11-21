// Must match the kinds accepted by record_study_heartbeat (migration 015).
export const STUDY_KINDS = ["roadmap", "test", "practice", "review", "build"] as const;
export type StudyKind = (typeof STUDY_KINDS)[number];

export const STUDY_KIND_LABELS: Record<StudyKind, string> = {
  roadmap: "Roadmaps",
  test: "Milestone tests",
  practice: "Coding practice",
  review: "Review",
  build: "Project blueprints",
};

/** Which learning activity a route counts as, or null when it isn't study time. */
export function studyKindForPath(path: string): StudyKind | null {
  if (/^\/roadmap\/[^/]+\/test(\/|$)/.test(path)) return "test";
  if (/^\/roadmap\/[^/]+/.test(path)) return "roadmap";
  if (/^\/practice\/challenge\/[^/]+/.test(path)) return "practice";
  if (/^\/review(\/|$)/.test(path)) return "review";
  // /build alone is the generator form; only an opened blueprint is study.
  if (/^\/build\/[^/]+/.test(path)) return "build";
  return null;
}

export function isStudyKind(value: unknown): value is StudyKind {
  return typeof value === "string" && (STUDY_KINDS as readonly string[]).includes(value);
}

/**
 * Shape of a generated project blueprint. The graph is a DAG: `nodes` are build
 * steps laid out in `lane`s (vertical columns of the dependency graph), `edges`
 * are dependencies between them.
 */

export type BlueprintKind = "setup" | "data" | "backend" | "frontend" | "ai" | "infra" | "polish";

export type BlueprintNode = {
  /** Stable slug used as the completion key and the edge endpoints. */
  key: string;
  label: string;
  /** What this step actually is, 1-2 sentences. */
  detail: string;
  kind: BlueprintKind;
  /** Column in the DAG. 0 = first things you build. */
  lane: number;
  /** Rough build time, e.g. "3h", "1d". */
  effort: string;
  /** Why this step is the interesting/hard one — shown on the node panel. */
  why?: string;
  /** Concrete technical approach for this step, the "how to do it well" bit. */
  approach?: string;
  /** Known trap for this step. */
  pitfall?: string;
};

export type BlueprintEdge = {
  from: string;
  to: string;
  /** Dashed, lower-emphasis link for "nice to have" ordering rather than a hard dep. */
  soft?: boolean;
  label?: string;
};

export type BlueprintPhase = {
  title: string;
  goal: string;
  /** node keys belonging to this phase */
  nodes: string[];
  /** What "done" looks like — the demoable outcome. */
  demo: string;
};

export type BlueprintApproach = {
  title: string;
  /** The efficient way to do it. */
  body: string;
  /** What most people do instead, and why it costs them. */
  instead?: string;
};

export type BlueprintGraph = {
  nodes: BlueprintNode[];
  edges: BlueprintEdge[];
  phases: BlueprintPhase[];
  approaches: BlueprintApproach[];
  /** Optional extensions once the core works. */
  stretch: string[];
  /** One line on why this project is not another CRUD todo app. */
  uniqueAngle: string;
};

export type BlueprintInputs = {
  stack: string;
  experience: string;
  time: string;
  goal: string;
  interests: string;
  teamSize: string;
  constraints: string;
};

export type ProjectBlueprint = {
  id: string;
  student_id: string;
  title: string;
  tagline: string;
  inputs: BlueprintInputs;
  graph: BlueprintGraph;
  used_fallback: boolean;
  created_at: string;
};

export const KIND_LABELS: Record<BlueprintKind, string> = {
  setup: "Setup",
  data: "Data",
  backend: "Backend",
  frontend: "Frontend",
  ai: "AI",
  infra: "Infra",
  polish: "Polish",
};

/** One hue per kind. Kept in sync with the legend and the SVG edge strokes. */
export const KIND_COLORS: Record<BlueprintKind, string> = {
  setup: "#8a8d93",
  data: "#0ea5e9",
  backend: "#7c3aed",
  frontend: "#ff5600",
  ai: "#e11d8f",
  infra: "#0a7d30",
  polish: "#b45309",
};

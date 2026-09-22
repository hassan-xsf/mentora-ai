"use server";

import { chatCompletion } from "@/lib/ai/stream";
import { parseJSONLoose } from "@/lib/ai/json";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { spendCredits, refundCredits } from "@/lib/credits/credits";
import type {
  BlueprintGraph,
  BlueprintInputs,
  BlueprintKind,
  BlueprintNode,
} from "@/lib/blueprints/types";

const KINDS: BlueprintKind[] = [
  "setup",
  "data",
  "backend",
  "frontend",
  "ai",
  "infra",
  "polish",
];

function slug(s: string, fallback: string): string {
  const out = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return out || fallback;
}

/**
 * Trust nothing from the model: keys must be unique, lanes numeric, kinds known,
 * and every edge must point at a node that actually exists — otherwise the graph
 * renders with dangling lines.
 */
function normalizeGraph(raw: BlueprintGraph): BlueprintGraph {
  const seen = new Set<string>();
  const nodes: BlueprintNode[] = (raw.nodes ?? [])
    .filter((n) => n && n.label)
    .map((n, i) => {
      let key = slug(n.key ?? n.label, `node-${i}`);
      while (seen.has(key)) key = `${key}-${i}`;
      seen.add(key);
      return {
        key,
        label: n.label,
        detail: n.detail ?? "",
        kind: KINDS.includes(n.kind) ? n.kind : "backend",
        // Only a seed: layoutGraph re-derives lanes from the edges, so a
        // missing or wrong value here costs nothing.
        lane: Number.isFinite(n.lane) ? Math.max(0, Math.floor(n.lane)) : 0,
        effort: n.effort ?? "",
        why: n.why,
        approach: n.approach,
        pitfall: n.pitfall,
      };
    });

  const keys = new Set(nodes.map((n) => n.key));
  // The model tends to write edge endpoints as labels; map them back to keys.
  const byLabel = new Map(nodes.map((n) => [n.label.toLowerCase(), n.key]));
  const resolve = (v: string) =>
    keys.has(v) ? v : byLabel.get((v ?? "").toLowerCase()) ?? slug(v ?? "", "");

  const edges = (raw.edges ?? [])
    .map((e) => ({ ...e, from: resolve(e.from), to: resolve(e.to) }))
    .filter((e) => keys.has(e.from) && keys.has(e.to) && e.from !== e.to);

  const phases = (raw.phases ?? []).map((p) => ({
    title: p.title ?? "Phase",
    goal: p.goal ?? "",
    demo: p.demo ?? "",
    nodes: (p.nodes ?? []).map(resolve).filter((k) => keys.has(k)),
  }));

  return {
    nodes,
    edges,
    phases,
    approaches: (raw.approaches ?? []).filter((a) => a && a.title),
    stretch: (raw.stretch ?? []).filter(Boolean),
    uniqueAngle: raw.uniqueAngle ?? "",
  };
}

function buildFallback(inputs: BlueprintInputs): {
  title: string;
  tagline: string;
  graph: BlueprintGraph;
} {
  const stack = inputs.stack || "your stack";
  const n = (
    key: string,
    label: string,
    kind: BlueprintKind,
    lane: number,
    detail: string,
    effort: string
  ): BlueprintNode => ({ key, label, kind, lane, detail, effort });

  const nodes: BlueprintNode[] = [
    n("scaffold", "Project scaffold", "setup", 0, `Bare ${stack} app, linting, one deployed "hello world".`, "2h"),
    n("schema", "Data model", "data", 0, "Sketch the three core entities and their relations before any UI.", "2h"),
    n("ingest", "Ingest source data", "data", 1, "Pull real data in from one source. Real data early kills fake assumptions.", "4h"),
    n("api", "Core API", "backend", 1, "One endpoint per real user action. No CRUD-for-CRUD's-sake routes.", "6h"),
    n("auth", "Auth & ownership", "backend", 2, "Login plus row-level ownership so users only see their own rows.", "3h"),
    n("ui-core", "Primary screen", "frontend", 2, "The single screen the whole product is about. Build this one properly.", "6h"),
    n("logic", "The hard bit", "ai", 3, "The one algorithm or integration that makes this project non-trivial.", "1d"),
    n("ui-detail", "Detail & edit views", "frontend", 3, "Everything that hangs off the primary screen.", "5h"),
    n("deploy", "Deploy pipeline", "infra", 4, "Push-to-deploy from day one, not at the end.", "3h"),
    n("polish", "Empty, loading, error states", "polish", 4, "The three states that separate a demo from a product.", "4h"),
  ];

  return {
    title: `Build something real with ${stack}`,
    tagline: "A staged build plan generated offline — regenerate for a tailored one.",
    graph: {
      nodes,
      edges: [
        { from: "scaffold", to: "api" },
        { from: "schema", to: "api" },
        { from: "schema", to: "ingest" },
        { from: "api", to: "auth" },
        { from: "api", to: "ui-core" },
        { from: "ingest", to: "logic" },
        { from: "auth", to: "ui-core" },
        { from: "ui-core", to: "ui-detail" },
        { from: "ui-core", to: "logic", soft: true },
        { from: "logic", to: "polish" },
        { from: "ui-detail", to: "polish" },
        { from: "scaffold", to: "deploy", soft: true },
      ],
      phases: [
        {
          title: "Walking skeleton",
          goal: "End-to-end path through every layer, however thin.",
          nodes: ["scaffold", "schema", "api", "deploy"],
          demo: "A deployed URL that reads one row from the database.",
        },
        {
          title: "The real feature",
          goal: "Build the part that makes this project yours.",
          nodes: ["ingest", "auth", "ui-core", "logic"],
          demo: "A user logs in and gets a result nothing off-the-shelf would give them.",
        },
        {
          title: "Make it defensible",
          goal: "The states and edges that reviewers actually check.",
          nodes: ["ui-detail", "polish"],
          demo: "Every screen survives empty, slow, and failed.",
        },
      ],
      approaches: [
        {
          title: "Walking skeleton before features",
          body: "Get one trivial request through every layer and deployed on day one. Every later step is then a change to a working system.",
          instead: "Most people build the whole backend first and meet deployment problems at the deadline.",
        },
        {
          title: "Real data on day two",
          body: "Seed with real, messy data from the actual source. Schema flaws surface while they are still cheap to fix.",
          instead: "Clean fake seed data hides every parsing and null-handling problem until demo day.",
        },
        {
          title: "One hard thing, done well",
          body: "Pick a single technically interesting component and go deep. Breadth is invisible in a review; one hard thing done well is the whole story.",
          instead: "Ten shallow features read as a tutorial follow-along.",
        },
      ],
      stretch: [
        "Add a second data source and reconcile conflicts between them",
        "Expose the core logic as a public API with rate limiting",
        "Write the one test that would have caught your worst bug",
      ],
      uniqueAngle:
        "Generated offline — the AI blueprint tailors the concept to your stack, time budget and interests.",
    },
  };
}

function buildPrompt(i: BlueprintInputs): string {
  return `You are a senior engineer designing a portfolio project brief for one specific student.

STUDENT
- Tech stack / tools they know: ${i.stack}
- Experience level: ${i.experience}
- Time available: ${i.time}
- Goal for the project: ${i.goal}
- Domains they find interesting: ${i.interests || "no strong preference"}
- Team size: ${i.teamSize}
- Constraints: ${i.constraints || "none stated"}

Invent ONE specific project. Hard requirements for the idea:
- It must NOT be a todo app, generic blog, chat clone, e-commerce demo, weather app, or CRUD admin panel.
- It must have exactly one technically interesting core: a real algorithm, a hard integration, a scheduling/matching problem, a parsing problem, a realtime constraint, or a data reconciliation problem.
- It must be finishable within ${i.time} at ${i.experience} level using ${i.stack}. Scope it honestly.
- Prefer an idea that uses a real public data source or a real workflow the student can observe.

Return ONLY valid JSON (no markdown fence, no prose) with this exact shape:
{
  "title": "Short project name",
  "tagline": "One sentence on what it does and for whom.",
  "graph": {
    "uniqueAngle": "One sentence on why this is not a generic tutorial project.",
    "nodes": [
      {"key":"kebab-case-id","label":"Build step","detail":"one sentence","kind":"setup","effort":"3h","why":"one short sentence","approach":"one or two short sentences, concrete","pitfall":"one short sentence"}
    ],
    "edges": [{"from":"kebab-case-id","to":"other-id","soft":false}],
    "phases": [{"title":"Phase name","goal":"what this phase achieves","nodes":["kebab-case-id"],"demo":"what you can show at the end of it"}],
    "approaches": [{"title":"Technique name","body":"How to do it and why it is efficient.","instead":"What people do instead and what it costs them."}],
    "stretch": ["extension once the core works"]
  }
}

Rules:
- Exactly 10 nodes. "kind" must be one of: setup, data, backend, frontend, ai, infra, polish.
- Edges express dependencies and drive the layout, so get them right: use node "key" values only, never labels. Every endpoint must exist in nodes. No cycles. Roughly 12-16 edges, and make the graph wide (several independent starting nodes) rather than one long chain. Use "soft":true for a suggestion rather than a hard dependency.
- Exactly 3 phases covering every node key exactly once.
- Exactly 4 approaches. These are the most valuable part: concrete and opinionated about the efficient way (name actual techniques, libraries or patterns), never generic advice like "write clean code".
- Exactly 3 stretch items, one line each.
- BREVITY IS CRITICAL: the reply must be complete valid JSON. Keep every string short and never exceed one or two sentences. A truncated reply is useless.
- Output raw JSON only, starting with { and ending with }.`;
}

export async function generateBlueprint(
  inputs: BlueprintInputs
): Promise<{ blueprintId: string }> {
  const user = await requireUser();
  const supabase = await createClient();
  const admin = createAdminClient();

  await supabase.from("students").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  await spendCredits(user.id, "generate_blueprint");

  let title: string;
  let tagline: string;
  let graph: BlueprintGraph;
  let usedFallback = false;

  try {
    const raw = await chatCompletion(buildPrompt(inputs));
    const parsed = parseJSONLoose<{
      title?: string;
      tagline?: string;
      graph?: BlueprintGraph;
    }>(raw);

    graph = normalizeGraph(parsed.graph ?? ({} as BlueprintGraph));
    if (graph.nodes.length < 5) {
      throw new Error(`AI returned only ${graph.nodes.length} nodes`);
    }
    // A truncated reply can be salvaged down to nodes with the edges array lost.
    // Without edges the layout collapses to one disconnected column, which is a
    // worse result than the curated fallback — so treat it as a failure.
    if (graph.edges.length === 0) {
      throw new Error("AI response had no usable edges");
    }
    title = parsed.title || `Project for ${inputs.stack}`;
    tagline = parsed.tagline ?? "";
  } catch (err) {
    console.error("[generate-blueprint] AI parse/validation failed, using fallback:", err);
    const fb = buildFallback(inputs);
    title = fb.title;
    tagline = fb.tagline;
    graph = fb.graph;
    usedFallback = true;
  }

  const { data, error } = await admin
    .from("project_blueprints")
    .insert({
      student_id: user.id,
      title,
      tagline,
      inputs,
      graph,
      used_fallback: usedFallback,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[generate-blueprint] insert error:", error);
    await refundCredits(user.id, "generate_blueprint").catch(() => undefined);
    throw new Error(error?.message ?? "Failed to save blueprint");
  }

  return { blueprintId: data.id };
}

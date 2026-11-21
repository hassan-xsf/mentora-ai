export type NextAction = { eyebrow: string; title: string; body: string; href: string; cta: string };

type RoadmapLite = { id: string; title: string; completion_percentage: number };
type NodeLite = { id: string; parent_id: string | null; title: string; section_index: number; position: number; is_completed: boolean };

const SECTION_LABELS = ["Foundations", "Intermediate", "Advanced"];
const sectionName = (i: number) => SECTION_LABELS[i] ?? `Section ${i + 1}`;

/**
 * The single most useful thing to do next. `active` is the most recent
 * unfinished roadmap with its nodes and unlocked sections (null if none).
 */
export function pickNextAction(
  roadmaps: RoadmapLite[],
  active: { roadmap: RoadmapLite; nodes: NodeLite[]; unlocked: number[] } | null
): NextAction {
  if (roadmaps.length === 0) {
    return {
      eyebrow: "Start here",
      title: "Find the career that fits you",
      body: "Answer 10 quick questions and get careers ranked by fit, then generate your first roadmap.",
      href: "/assessment",
      cta: "Take the career assessment",
    };
  }

  if (!active) {
    return {
      eyebrow: "All roadmaps complete",
      title: "Keep your skills sharp",
      body: "Try a coding challenge, or start a new roadmap for your next career goal.",
      href: "/practice",
      cta: "Try a coding challenge",
    };
  }

  const { roadmap, nodes, unlocked } = active;
  const href = `/roadmap/${roadmap.id}`;
  // Document order: section, then trunk position, each trunk followed by its children.
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const order = (n: NodeLite) => {
    const parent = n.parent_id ? byId.get(n.parent_id) : undefined;
    return parent ? parent.position * 1000 + 1 + n.position : n.position * 1000;
  };
  const next = nodes
    .filter((n) => !n.is_completed)
    .sort((a, b) => a.section_index - b.section_index || order(a) - order(b))[0];

  // Every topic done but the roadmap isn't 100%: a milestone test is outstanding.
  if (!next) {
    return {
      eyebrow: roadmap.title,
      title: "Take your final milestone test",
      body: "You've finished every topic. Pass the last test to complete the roadmap and earn your certificate.",
      href,
      cta: "Go to the test",
    };
  }

  // Next topic sits in a locked section: the previous section's test is the blocker.
  if (!unlocked.includes(next.section_index)) {
    const prev = next.section_index - 1;
    return {
      eyebrow: roadmap.title,
      title: `Take the ${sectionName(prev)} milestone test`,
      body: `Score 70% or more to unlock ${sectionName(next.section_index)}.`,
      href,
      cta: "Go to the test",
    };
  }

  return {
    eyebrow: `${roadmap.title} · ${roadmap.completion_percentage}%`,
    title: `Continue with ${next.title}`,
    body: `Next topic in ${sectionName(next.section_index)}. Read the resources, then tick off its tasks.`,
    href,
    cta: roadmap.completion_percentage === 0 ? "Start roadmap" : "Continue roadmap",
  };
}

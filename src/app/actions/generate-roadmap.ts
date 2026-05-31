"use server";

import { chatCompletion } from "@/lib/ai/stream";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";

type RoadmapResource = {
  title: string;
  type: "video" | "article" | "note";
  url?: string;
};

type RoadmapTask = {
  title: string;
};

type RoadmapNode = {
  title: string;
  description: string;
  resources: RoadmapResource[];
  tasks: RoadmapTask[];
};

type RoadmapSection = {
  title: string;
  nodes: RoadmapNode[];
};

type GeneratedRoadmap = {
  title: string;
  sections: RoadmapSection[];
};

function extractJSON(raw: string): string {
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  const firstObj = cleaned.indexOf("{");
  const firstArr = cleaned.indexOf("[");
  const candidates = [firstObj, firstArr].filter((i) => i !== -1);
  const first = candidates.length > 0 ? Math.min(...candidates) : -1;

  const last = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));

  if (first !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }
  return cleaned;
}

function buildFallbackRoadmap(careerTitle: string): GeneratedRoadmap {
  const sections = [
    {
      title: "Foundations",
      nodeTitles: [
        `Core Concepts of ${careerTitle}`,
        "Essential Tools & Setup",
        "Fundamental Skills",
        "First Hands-On Project",
      ],
    },
    {
      title: "Intermediate",
      nodeTitles: [
        "Applied Techniques",
        "Real-World Patterns",
        "Working with Data",
        "Collaboration & Workflows",
      ],
    },
    {
      title: "Advanced",
      nodeTitles: [
        "System Design & Architecture",
        "Performance & Optimisation",
        "Specialisation Topics",
        "Production-Ready Practices",
      ],
    },
  ];

  return {
    title: `Become a ${careerTitle}`,
    sections: sections.map((s) => ({
      title: s.title,
      nodes: s.nodeTitles.map((title) => ({
        title,
        description: `Learn ${title.toLowerCase()} as a ${careerTitle}. Build practical understanding through guided study and hands-on practice.`,
        resources: [
          { title: `${title} — overview video`, type: "video" as const, url: undefined },
          { title: `${title} — detailed guide`, type: "article" as const, url: undefined },
          { title: `${title} — key takeaways`, type: "note" as const, url: undefined },
        ],
        tasks: [
          { title: `Read about ${title.toLowerCase()} and take notes` },
          { title: `Build a small example demonstrating ${title.toLowerCase()}` },
          { title: `Explain ${title.toLowerCase()} in your own words` },
        ],
      })),
    })),
  };
}

export async function generateRoadmap(
  careerTitle: string,
  careerDescription: string
): Promise<{ roadmapId: string }> {
  const user = await requireUser();
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Ensure the students row exists (self-heal if the auth trigger never fired)
  await supabase.from("students").upsert(
    { id: user.id, email: user.email ?? "", full_name: user.user_metadata?.full_name ?? null },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const prompt = `You are an expert curriculum designer creating a comprehensive learning roadmap for someone who wants to become a ${careerTitle}.

CAREER CONTEXT:
${careerDescription}

YOUR TASK: Generate a full 3-section roadmap with 4 nodes per section (12 nodes total).

STRICT REQUIREMENTS:
1. EXACTLY 3 sections with these EXACT titles in this EXACT order:
   - "Foundations" (absolute beginner concepts)
   - "Intermediate" (applied skills and real-world patterns)
   - "Advanced" (expert-level specialisation and production concerns)

2. EACH section MUST contain EXACTLY 4 nodes (12 nodes total — NEVER fewer)

3. EACH node MUST have:
   - title: specific topic name (NOT "Introduction to X" — pick a real, distinct concept)
   - description: 2-3 sentences explaining what the learner will master
   - resources: array of EXACTLY 3 items, each with {title, type, url}
     - type MUST be one of: "video", "article", "note"
     - url can be null
   - tasks: array of EXACTLY 3 specific, actionable tasks

4. Node titles must be DIFFERENT and progressively build on each other. Examples for a Software Engineer roadmap:
   Foundations: "Variables & Data Types", "Control Flow & Loops", "Functions & Scope", "Arrays & Objects"
   Intermediate: "REST APIs", "Database Modelling", "Authentication", "Error Handling Patterns"
   Advanced: "System Design", "Caching Strategies", "Concurrency", "Production Observability"

   DO NOT use generic titles like "Introduction" or "Getting Started". Pick concrete topics.

OUTPUT FORMAT — return ONLY this JSON object:
{
  "title": "Become a ${careerTitle}",
  "sections": [
    {
      "title": "Foundations",
      "nodes": [
        {
          "title": "Concrete Topic Name",
          "description": "Two to three sentence explanation of what they'll learn and why it matters.",
          "resources": [
            {"title": "Resource title", "type": "video", "url": null},
            {"title": "Resource title", "type": "article", "url": null},
            {"title": "Resource title", "type": "note", "url": null}
          ],
          "tasks": [
            {"title": "Specific actionable task"},
            {"title": "Specific actionable task"},
            {"title": "Specific actionable task"}
          ]
        },
        ... 3 more nodes ...
      ]
    },
    ... 2 more sections (Intermediate, Advanced) with 4 nodes each ...
  ]
}

CRITICAL OUTPUT RULES:
- Return ONLY the raw JSON object. Start with { and end with }
- NO markdown code fences. NO explanations before or after.
- ALL 3 sections MUST be present. ALL 4 nodes per section MUST be present.`;

  let roadmapData: GeneratedRoadmap;

  try {
    const raw = await chatCompletion(prompt);
    const cleaned = extractJSON(raw);
    roadmapData = JSON.parse(cleaned) as GeneratedRoadmap;

    // Validate structure — if the AI under-delivered, throw to use fallback
    if (
      !roadmapData.sections ||
      !Array.isArray(roadmapData.sections) ||
      roadmapData.sections.length < 2
    ) {
      throw new Error(`AI returned only ${roadmapData.sections?.length ?? 0} sections`);
    }

    // Check each section has at least 2 nodes
    for (const section of roadmapData.sections) {
      if (!section.nodes || !Array.isArray(section.nodes) || section.nodes.length < 2) {
        throw new Error(`Section "${section.title}" has only ${section.nodes?.length ?? 0} nodes`);
      }
    }
  } catch (err) {
    console.error("[generate-roadmap] AI parse/validation failed, using full structured fallback:", err);
    roadmapData = buildFallbackRoadmap(careerTitle);
  }

  // Insert roadmap
  const { data: roadmap, error: roadmapError } = await adminSupabase
    .from("roadmaps")
    .insert({
      student_id: user.id,
      title: roadmapData.title,
      completion_percentage: 0,
    })
    .select("id")
    .single();

  if (roadmapError || !roadmap) {
    console.error("[generate-roadmap] Supabase insert error:", roadmapError);
    throw new Error(roadmapError?.message ?? "Failed to create roadmap");
  }

  const roadmapId = roadmap.id;

  // Insert nodes, resources, tasks per section
  for (let sectionIdx = 0; sectionIdx < roadmapData.sections.length; sectionIdx++) {
    const section = roadmapData.sections[sectionIdx];

    for (let nodeIdx = 0; nodeIdx < section.nodes.length; nodeIdx++) {
      const nodeData = section.nodes[nodeIdx];

      const { data: node, error: nodeError } = await adminSupabase
        .from("nodes")
        .insert({
          roadmap_id: roadmapId,
          title: nodeData.title,
          description: nodeData.description,
          position: nodeIdx,
          section_index: sectionIdx,
        })
        .select("id")
        .single();

      if (nodeError || !node) {
        console.error("[generate-roadmap] Node insert error:", nodeError);
        continue;
      }

      // Insert resources
      if (nodeData.resources && nodeData.resources.length > 0) {
        const resourcesToInsert = nodeData.resources.map((r) => ({
          node_id: node.id,
          title: r.title,
          type: (["video", "article", "note"].includes(r.type) ? r.type : "article") as "video" | "article" | "note",
          url: r.url ?? null,
          content: null,
        }));
        await adminSupabase.from("resources").insert(resourcesToInsert);
      }

      // Insert tasks
      if (nodeData.tasks && nodeData.tasks.length > 0) {
        const tasksToInsert = nodeData.tasks.map((t, tIdx) => ({
          node_id: node.id,
          title: t.title,
          position: tIdx,
        }));
        await adminSupabase.from("node_tasks").insert(tasksToInsert);
      }
    }

    // Create milestone test for this section
    await adminSupabase.from("milestone_tests").insert({
      roadmap_id: roadmapId,
      section_index: sectionIdx,
      type: "mcq" as const,
      title: `${section.title} Milestone Test`,
      questions: [],
    });
  }

  // Unlock section 0 by default
  await adminSupabase.from("unlocked_sections").insert({
    student_id: user.id,
    roadmap_id: roadmapId,
    section_index: 0,
  });

  return { roadmapId };
}

"use server";

import { chatCompletion } from "@/lib/openai/stream";
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

  const prompt = `You are a curriculum designer AI. Generate a comprehensive learning roadmap for someone who wants to become a ${careerTitle}.

Career description: ${careerDescription}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "string (e.g., 'Become a ${careerTitle}')",
  "sections": [
    {
      "title": "string (section name, e.g., 'Foundations')",
      "nodes": [
        {
          "title": "string (topic name)",
          "description": "string (2-3 sentences about what to learn)",
          "resources": [
            { "title": "string", "type": "video|article|note", "url": "string or null" }
          ],
          "tasks": [
            { "title": "string (actionable task)" }
          ]
        }
      ]
    }
  ]
}

Requirements:
- Create exactly 3 sections (e.g., Foundations, Intermediate, Advanced)
- Each section must have 3-5 nodes
- Each node must have 2-3 resources and 2-4 tasks
- Resource types must be exactly: video, article, or note
- URLs can be null if not known
- Make tasks specific and actionable
- Return ONLY the JSON, no markdown, no explanation`;

  let roadmapData: GeneratedRoadmap;

  try {
    const raw = await chatCompletion(prompt);
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    roadmapData = JSON.parse(cleaned) as GeneratedRoadmap;
  } catch {
    // Fallback minimal roadmap
    roadmapData = {
      title: `Become a ${careerTitle}`,
      sections: [
        {
          title: "Foundations",
          nodes: [
            {
              title: "Introduction to " + careerTitle,
              description: "Learn the fundamental concepts and basics needed to start your journey.",
              resources: [
                { title: "Getting Started Guide", type: "article" as const, url: undefined },
                { title: "Introduction Video", type: "video" as const, url: undefined },
              ],
              tasks: [
                { title: "Research the field and key technologies" },
                { title: "Set up your development environment" },
              ],
            },
          ],
        },
      ],
    };
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

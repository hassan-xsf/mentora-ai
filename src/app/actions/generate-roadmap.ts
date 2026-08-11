"use server";

import { chatCompletion } from "@/lib/ai/stream";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";

type RoadmapResource = {
  title: string;
  type: "video" | "article" | "note";
  url?: string | null;
};

type RoadmapTask = {
  title: string;
};

type RoadmapNode = {
  title: string;
  description: string;
  resources: RoadmapResource[];
  tasks: RoadmapTask[];
  /** Optional sub-topics that branch off this trunk node (e.g. npm/yarn/pnpm off "Package Managers"). */
  children?: RoadmapNode[];
};

type RoadmapSection = {
  title: string;
  nodes: RoadmapNode[];
};

type GeneratedRoadmap = {
  title: string;
  sections: RoadmapSection[];
};

function normalizeNode(node: RoadmapNode): RoadmapNode {
  return {
    ...node,
    tasks: (node.tasks ?? [])
      .map((t) => (typeof t === "string" ? { title: t } : t))
      .filter((t) => t.title),
    resources: (node.resources ?? [])
      .map((r): RoadmapResource =>
        typeof r === "string" ? { title: r, type: "note", url: null } : r
      )
      .filter((r) => r.title),
    // Recurse one level; children never carry grandchildren (tree is trunk + branches).
    children: (node.children ?? [])
      .map((c) => ({ ...normalizeNode(c), children: undefined }))
      .filter((c) => c.title),
  };
}

function normalizeRoadmap(data: GeneratedRoadmap): GeneratedRoadmap {
  return {
    ...data,
    sections: (data.sections ?? []).map((section) => ({
      ...section,
      nodes: (section.nodes ?? []).map(normalizeNode),
    })),
  };
}

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
      nodes: s.nodeTitles.map((title, idx) => ({
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
        // Give roughly half the trunk nodes a couple of branch sub-topics so the
        // fallback roadmap still renders as a tree rather than a flat list.
        children:
          idx % 2 === 0
            ? [`Core approach`, `Common tools`, `Best practices`].map((sub) => ({
                title: `${sub}: ${title}`,
                description: `Explore ${sub.toLowerCase()} within ${title.toLowerCase()}.`,
                resources: [
                  { title: `${sub} — guide`, type: "article" as const, url: undefined },
                ],
                tasks: [{ title: `Practice ${sub.toLowerCase()} for ${title.toLowerCase()}` }],
              }))
            : undefined,
      })),
    })),
  };
}

/**
 * Insert a single node (trunk or branch) plus its resources and tasks.
 * Returns the created node id, or null if the insert failed.
 */
async function insertNode(
  adminSupabase: ReturnType<typeof createAdminClient>,
  args: {
    roadmapId: string;
    nodeData: RoadmapNode;
    position: number;
    sectionIndex: number;
    parentId: string | null;
    branchSide: "left" | "right" | null;
  }
): Promise<{ id: string } | null> {
  const { roadmapId, nodeData, position, sectionIndex, parentId, branchSide } = args;

  const { data: node, error: nodeError } = await adminSupabase
    .from("nodes")
    .insert({
      roadmap_id: roadmapId,
      title: nodeData.title,
      description: nodeData.description,
      position,
      section_index: sectionIndex,
      parent_id: parentId,
      branch_side: branchSide,
    })
    .select("id")
    .single();

  if (nodeError || !node) {
    console.error("[generate-roadmap] Node insert error:", nodeError);
    return null;
  }

  if (nodeData.resources && nodeData.resources.length > 0) {
    const resourcesToInsert = nodeData.resources.map((r) => ({
      node_id: node.id,
      title: r.title,
      type: (["video", "article", "note"].includes(r.type) ? r.type : "article") as
        | "video"
        | "article"
        | "note",
      url: r.url ?? null,
      content: null,
    }));
    await adminSupabase.from("resources").insert(resourcesToInsert);
  }

  if (nodeData.tasks && nodeData.tasks.length > 0) {
    const tasksToInsert = nodeData.tasks.map((t, tIdx) => ({
      node_id: node.id,
      title: t.title,
      position: tIdx,
    }));
    await adminSupabase.from("node_tasks").insert(tasksToInsert);
  }

  return node;
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

  const prompt = `Generate a learning roadmap JSON for becoming a ${careerTitle}.
Career context: ${careerDescription}

Return ONLY valid JSON (no markdown, no explanation) matching this exact structure:
{"title":"Become a ${careerTitle}","sections":[{"title":"Foundations","nodes":[{"title":"Topic","description":"2 sentences.","resources":[{"title":"r","type":"video","url":null},{"title":"r","type":"article","url":null},{"title":"r","type":"note","url":null}],"tasks":[{"title":"task"},{"title":"task"},{"title":"task"}],"children":[{"title":"Sub-topic","description":"1 sentence.","resources":[{"title":"r","type":"article","url":null}],"tasks":[{"title":"task"}]}]}]},{"title":"Intermediate","nodes":[...]},{"title":"Advanced","nodes":[...]}]}

Rules:
- 3 sections: Foundations, Intermediate, Advanced
- 4 nodes per section (12 trunk nodes total). These are the main path.
- Each trunk node: title (specific concept, not "Introduction"), description (2 sentences), 3 resources (one each of video/article/note, url:null), 3 tasks
- IMPORTANT: For nodes that naturally split into concrete choices/tools, add a "children" array of 2-4 sub-topics that branch off it (e.g. a "Package Managers" node has children npm, yarn, pnpm; a "Frameworks" node has children React, Vue, Angular). Not every node needs children — only where it makes sense. Aim for children on roughly half the trunk nodes.
- Each child: title, short description (1 sentence), 1-2 resources, 1-2 tasks. Children do NOT have their own children.
- Output raw JSON only, starting with { and ending with }`;

  let roadmapData: GeneratedRoadmap;
  let usedFallback = false;

  try {
    const raw = await chatCompletion(prompt);
    console.log("[generate-roadmap] raw AI response length:", raw.length);
    console.log("[generate-roadmap] raw AI response (first 2000):", raw.slice(0, 2000));
    const cleaned = extractJSON(raw);
    roadmapData = normalizeRoadmap(JSON.parse(cleaned) as GeneratedRoadmap);

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
    usedFallback = true;
  }

  // Insert roadmap
  const { data: roadmap, error: roadmapError } = await adminSupabase
    .from("roadmaps")
    .insert({
      student_id: user.id,
      title: roadmapData.title,
      completion_percentage: 0,
      used_fallback: usedFallback,
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

      // Insert the trunk node (parent_id null), then its branch children.
      const trunk = await insertNode(adminSupabase, {
        roadmapId,
        nodeData,
        position: nodeIdx,
        sectionIndex: sectionIdx,
        parentId: null,
        branchSide: null,
      });

      if (!trunk) continue;

      // Insert children as branches, alternating sides so the tree balances.
      const children = nodeData.children ?? [];
      for (let childIdx = 0; childIdx < children.length; childIdx++) {
        await insertNode(adminSupabase, {
          roadmapId,
          nodeData: children[childIdx],
          position: childIdx,
          sectionIndex: sectionIdx,
          parentId: trunk.id,
          branchSide: childIdx % 2 === 0 ? "right" : "left",
        });
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

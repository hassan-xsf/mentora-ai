"use server";

import { chatCompletion } from "@/lib/ai/stream";
import { extractJSON } from "@/lib/ai/json";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth/session";
import { spendCredits, refundCredits } from "@/lib/credits/credits";

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

  // Charge before doing any AI work; refunded below if we fail to persist.
  await spendCredits(user.id, "generate_roadmap");

  const prompt = `You are a senior ${careerTitle} designing the learning roadmap you wish you had been given. Produce it as JSON.

Career context: ${careerDescription}

Return ONLY valid JSON (no markdown, no explanation) matching this exact structure:
{"title":"Become a ${careerTitle}","sections":[{"title":"Foundations","nodes":[{"title":"Topic","description":"2 sentences.","resources":[{"title":"Exact resource name — Author or site","type":"video","url":"https://..."},{"title":"...","type":"article","url":"https://..."},{"title":"...","type":"note","url":null}],"tasks":[{"title":"task"},{"title":"task"},{"title":"task"}],"children":[{"title":"Sub-topic","description":"1 sentence.","resources":[{"title":"...","type":"article","url":"https://..."}],"tasks":[{"title":"task"}]}]}]},{"title":"Intermediate","nodes":[...]},{"title":"Advanced","nodes":[...]}]}

STRUCTURE
- Exactly 3 sections: Foundations, Intermediate, Advanced.
- 4 trunk nodes per section (12 total) — the main path, in strict dependency order: nothing depends on something taught later.
- Node titles name a specific skill or concept ("HTTP Requests and Status Codes", "Indexing and Query Plans"). Never "Introduction", "Basics", "Getting Started", "Advanced Topics".
- Description: 2 sentences — what it is, and why it matters for this specific career.
- Children: for nodes that split into concrete competing tools or sub-skills, add 2-4 children (e.g. "Package Managers" → npm, pnpm, yarn; "Deployment" → Vercel, Docker, CI pipelines). Only where it makes sense — roughly half the trunk nodes. Children have title, 1-sentence description, 1-2 resources, 1-2 tasks, and no children of their own.

RESOURCES — this is the part most roadmaps get wrong, so be strict
- Each trunk node gets 3-4 resources. Include at least one video and at least one article. A "note" type is a short written summary you author yourself — for notes, set url to null.
- Name REAL, well-known resources that actually exist and are widely recommended for this topic: official documentation (MDN, the language/framework docs), a named free course or YouTube series with its creator ("The Net Ninja", "freeCodeCamp", "3Blue1Brown", "CS50"), a specific well-known book with its author, or a canonical article.
- Put the real URL in "url" when you are confident of it — official docs domains, freecodecamp.org, developer.mozilla.org, a specific YouTube channel, a book's publisher page. If you are NOT confident the exact URL is correct, set url to null and keep the precise title so the learner can search it. Never invent a URL that looks plausible but may not exist, and never link to a generic homepage as if it were the lesson.
- Prefer free resources. Mark paid ones in the title, e.g. "(paid)".
- Every resource title must be searchable on its own — "Official React docs: useEffect" not "React guide".

TASKS
- 3 tasks per trunk node, each a concrete thing to BUILD or DO with a checkable result, not "read about X" or "understand X".
- Good: "Build a CLI that reads a CSV and prints the top 10 rows by a column the user names." Bad: "Learn file handling."
- At least one task per section should produce something portfolio-worthy.

Output raw JSON only, starting with { and ending with }`;

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
    // Nothing was delivered — give the credits back.
    await refundCredits(user.id, "generate_roadmap").catch(() => undefined);
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

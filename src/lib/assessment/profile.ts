/**
 * Deterministic skill/interest profile from assessment answers. Same answers →
 * same profile, so the radar chart is reproducible and the AI is given the same
 * numbers the student sees.
 */

export const DIMENSIONS = [
  "analytical",
  "building",
  "design",
  "people",
  "data",
  "infrastructure",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<Dimension, string> = {
  analytical: "Analytical",
  building: "Building",
  design: "Design & creative",
  people: "People & communication",
  data: "Data",
  infrastructure: "Infrastructure & security",
};

type Weights = Partial<Record<Dimension, number>>;

/**
 * slug → option text → weight per dimension. Option text must match the seed in
 * supabase/migrations/009_assessments.sql exactly (profile.test.ts enforces it).
 * Options that say nothing about a dimension map to {}.
 */
export const OPTION_WEIGHTS: Record<string, Record<string, Weights>> = {
  coding_level: {
    "Nothing yet — I have not written code outside a tutorial": {},
    "Small scripts or exercises that solve one problem": { building: 1 },
    "A working app or site I finished on my own": { building: 2 },
    "A multi-part project with a database, users, or an API": { building: 3, infrastructure: 1 },
    "Something used by real people, or work I was paid for": { building: 3, infrastructure: 1, people: 1 },
  },
  math_comfort: {
    "I avoid maths and want a path with as little as possible": {},
    "I can handle it when it has a clear practical purpose": { analytical: 1 },
    "Comfortable with statistics and probability": { analytical: 2, data: 2 },
    "Comfortable with calculus and linear algebra": { analytical: 3, data: 2 },
    "Maths is a strength — proofs and theory are enjoyable": { analytical: 3, data: 1 },
  },
  energy_source: {
    "Chasing down why something is broken until it works": { analytical: 2, building: 1 },
    "Making an interface look and feel exactly right": { design: 3, building: 1 },
    "Digging through a messy dataset for the real story": { data: 3, analytical: 1 },
    "Designing how parts of a large system fit together": { infrastructure: 2, analytical: 2, building: 1 },
    "Automating a boring manual process away": { building: 2, infrastructure: 2 },
    "Talking to users and turning their needs into a plan": { people: 3, design: 1 },
    "Breaking into something to prove it is not secure": { infrastructure: 3, analytical: 1 },
    "Explaining a hard concept so others finally get it": { people: 3 },
  },
  drain_source: {
    "Long meetings and stakeholder alignment": { people: -2 },
    "Pixel-level visual polish": { design: -2 },
    "Heavy maths and statistics": { analytical: -1, data: -2 },
    "Being on call for production incidents": { infrastructure: -2 },
    "Reading dense documentation and specifications": { infrastructure: -1 },
    "Repetitive, well-defined tasks with no ambiguity": {},
    "Presenting and persuading in front of a group": { people: -2 },
  },
  time_commitment: {
    "Under 5 — I need a slow, steady path": {},
    "5-10 hours alongside other commitments": {},
    "10-20 hours, this is a serious focus": {},
    "20+ hours, I am going at this full time": {},
  },
  horizon: {
    "Within 6 months — fastest route to employable": {},
    "About a year": {},
    "2+ years, I am still studying": {},
    "No deadline — depth matters more than speed": {},
  },
  learning_style: {
    "Building projects and looking things up as I hit them": { building: 1 },
    "Structured courses worked through in order": {},
    "Reading documentation and books first, then applying": { analytical: 1 },
    "Video walkthroughs I can follow along with": {},
    "Working through problem sets and challenges": { analytical: 2 },
  },
  motivation: {
    "Strong pay and financial security": {},
    "Deep technical mastery and respect for the craft": { analytical: 1, infrastructure: 1 },
    "Building products that people visibly use": { building: 1, design: 1 },
    "Autonomy and flexibility over my time": {},
    "Work that has a social or scientific impact": { data: 1 },
    "Leading teams and shaping direction": { people: 2 },
  },
  ambiguity: {
    "Stressful — I want clear requirements": {},
    "Uncomfortable but manageable": {},
    "Fine, I will find a direction": { analytical: 1 },
    "Good — this is where I do my best work": { analytical: 1, design: 1 },
    "Ideal — ambiguity is the interesting part": { analytical: 2, design: 1 },
  },
  debug_patience: {
    "Frustrated — I would want to hand it off": {},
    "I push on but it wears me down": {},
    "I take a break and come back methodically": { analytical: 1, building: 1 },
    "I get more stubborn the longer it takes": { analytical: 2, building: 1, infrastructure: 1 },
  },
  visual_sense: {
    "Weak — I cannot tell why something looks off": {},
    "Below average": {},
    "Average — I notice obvious problems": { design: 1 },
    "Strong — bad spacing bothers me": { design: 2 },
    "Very strong — I redesign things in my head": { design: 3 },
  },
  people_facing: {
    "Almost none — deep solo focus": {},
    "Mostly solo with occasional check-ins": {},
    "An even split": { people: 1 },
    "Mostly collaborative": { people: 2 },
    "Constant contact — people are the job": { people: 3 },
  },
  risk_tolerance: {
    "Stable large employer, clear ladder, predictable work": {},
    "Established mid-size company with room to move": {},
    "Early startup — more chaos, more ownership": { building: 1 },
    "Freelance or contract work I source myself": { people: 1 },
    "Research, academia, or an open-source funded role": { analytical: 1 },
  },
  domain_pull: {
    "Health and medicine": { data: 1 },
    "Finance and markets": { data: 1, analytical: 1 },
    "Games and entertainment": { building: 1, design: 1 },
    "Climate and energy": { data: 1 },
    Education: { people: 1 },
    "Robotics and hardware": { building: 1, infrastructure: 1 },
    "Security and privacy": { infrastructure: 2 },
    "Developer tools and infrastructure": { infrastructure: 2, building: 1 },
    "No strong preference — the work matters more": {},
  },
  writing: {
    "I avoid it": { people: -1 },
    "I can do it but would rather not": {},
    Neutral: {},
    "I am comfortable and reasonably good at it": { people: 1 },
    "It is one of my strengths": { people: 2 },
  },
  tools_touched: {
    "Git and GitHub": { building: 1 },
    "A terminal or command line": { infrastructure: 1 },
    "HTML and CSS": { design: 1, building: 1 },
    Python: { data: 1, building: 1 },
    "JavaScript or TypeScript": { building: 1 },
    "SQL or a database": { data: 2 },
    "A spreadsheet for real analysis": { data: 1, analytical: 1 },
    "Figma or another design tool": { design: 2 },
    "Cloud services (AWS, GCP, Azure)": { infrastructure: 2 },
    "None of these yet": {},
  },
  feedback_loop: {
    "Seeing something visible change immediately": { design: 1, building: 1 },
    "A test suite going green": { building: 1, infrastructure: 1 },
    "A number improving — speed, accuracy, cost": { data: 2, analytical: 1 },
    "Someone telling me the thing helped them": { people: 2 },
    "Finally understanding a concept that was opaque": { analytical: 2 },
  },
  credential_path: {
    "In a computing or engineering degree now": {},
    "In a degree in a different field": {},
    "Degree finished, changing direction": {},
    "No degree — self-taught route": {},
    "Bootcamp or certificate route": {},
  },
};

export type ProfileAnswer = {
  slug: string;
  question: string;
  answer: string | string[];
};

export type Evidence = { question: string; answer: string; weight: number };

export type SkillProfile = {
  /** 0–100 per dimension: net evidence as a share of the most this answer set could have shown. */
  scores: Record<Dimension, number>;
  /** The answers that moved each score, strongest first. */
  evidence: Record<Dimension, Evidence[]>;
  constraints: {
    hours_per_week: string | null;
    timeline: string | null;
    experience: string | null;
  };
};

function emptyRecord<T>(make: () => T): Record<Dimension, T> {
  return Object.fromEntries(DIMENSIONS.map((d) => [d, make()])) as Record<Dimension, T>;
}

export function computeProfile(answers: ProfileAnswer[]): SkillProfile {
  const net = emptyRecord(() => 0);
  const possible = emptyRecord(() => 0);
  const evidence = emptyRecord<Evidence[]>(() => []);

  for (const a of answers) {
    const table = OPTION_WEIGHTS[a.slug];
    if (!table) continue;
    const picked = Array.isArray(a.answer) ? a.answer : [a.answer];

    for (const d of DIMENSIONS) {
      // Ceiling = best single option for this dimension, so picking many options
      // of a multi-choice can't outscore one strong signal elsewhere.
      const ceiling = Math.max(0, ...Object.values(table).map((w) => w[d] ?? 0));
      possible[d] += ceiling;

      let sum = 0;
      for (const option of picked) {
        const w = table[option]?.[d] ?? 0;
        if (w === 0) continue;
        sum += w;
        evidence[d].push({ question: a.question, answer: option, weight: w });
      }
      net[d] += Math.min(ceiling, Math.max(-3, sum));
    }
  }

  const scores = emptyRecord(() => 0);
  for (const d of DIMENSIONS) {
    scores[d] = possible[d] > 0 ? Math.max(0, Math.min(100, Math.round((100 * net[d]) / possible[d]))) : 0;
    evidence[d].sort((x, y) => Math.abs(y.weight) - Math.abs(x.weight));
  }

  const single = (slug: string) => {
    const v = answers.find((a) => a.slug === slug)?.answer;
    return typeof v === "string" ? v : null;
  };

  return {
    scores,
    evidence,
    constraints: {
      hours_per_week: single("time_commitment"),
      timeline: single("horizon"),
      experience: single("coding_level"),
    },
  };
}

/** Which dimensions a career title leans on. Title keywords only — descriptions mention everything. */
const CAREER_SIGNALS: [RegExp, Dimension[]][] = [
  [/data|analytic|machine learning|\bml\b|\bai\b|scien|statistic|\bbi\b/i, ["data", "analytical"]],
  [/front.?end|\bui\b|\bux\b|design|interface|creative/i, ["design"]],
  [/devops|\bsre\b|reliability|cloud|infra|platform|security|cyber|network|penetration|systems/i, ["infrastructure"]],
  [/product|manager|solutions|consult|writer|advocate|support|customer|teach|instructor|community|sales/i, ["people"]],
  [/engineer|developer|programmer|full.?stack|back.?end|mobile|game|automation|\bqa\b/i, ["building"]],
  [/research|algorithm|quant|architect/i, ["analytical"]],
];

export function careerDimensions(title: string): Dimension[] {
  const dims = new Set<Dimension>();
  for (const [re, ds] of CAREER_SIGNALS) if (re.test(title)) ds.forEach((d) => dims.add(d));
  return DIMENSIONS.filter((d) => dims.has(d));
}

export const STRONG = 55;
export const WEAK = 35;

/** Deterministic "matched on" / "weaker on" split for one career against a profile. */
export function matchCareer(title: string, profile: SkillProfile) {
  const dims = careerDimensions(title);
  return {
    matched: dims.filter((d) => profile.scores[d] >= STRONG),
    weaker: dims.filter((d) => profile.scores[d] < WEAK),
  };
}

/** Dimensions ordered strongest first. */
export function rankedDimensions(profile: SkillProfile): Dimension[] {
  return [...DIMENSIONS].sort((a, b) => profile.scores[b] - profile.scores[a]);
}

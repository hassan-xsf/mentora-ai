// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Student = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  xp_total: number;
  streak_count: number;
  last_active_date: string | null;
  created_at: string;
};

export type Career = {
  id: string;
  title: string;
  description: string;
  demand_indicator: "High" | "Medium" | "Low";
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  created_at: string;
};

export type CareerSuggestion = {
  career: Career;
  fit_score: number; // 0–100
};

export type Roadmap = {
  id: string;
  student_id: string;
  career_id: string;
  career?: Career;
  title: string;
  completion_percentage: number;
  created_at: string;
};

export type Node = {
  id: string;
  roadmap_id: string;
  title: string;
  description: string;
  position: number;
  section_index: number; // which gated section this node belongs to
  is_completed: boolean;
  resources?: Resource[];
  tasks?: NodeTask[];
};

export type Resource = {
  id: string;
  node_id: string;
  title: string;
  type: "video" | "article" | "note";
  url: string | null;
  content: string | null;
};

export type NodeTask = {
  id: string;
  node_id: string;
  title: string;
  is_completed: boolean;
};

// ─── Milestone Tests ──────────────────────────────────────────────────────────

export type MilestoneTestType = "mcq" | "qa" | "coding";

export type MilestoneTest = {
  id: string;
  roadmap_id: string;
  section_index: number; // gates access to section_index + 1
  type: MilestoneTestType;
  title: string;
  questions: MilestoneQuestion[];
  created_at: string;
};

export type MilestoneQuestion = {
  id: string;
  question: string;
  type: MilestoneTestType;
  options?: string[];       // MCQ only
  correct_answer?: string;  // MCQ / Q&A
  starter_code?: string;    // coding only
};

export type MilestoneTestAttempt = {
  id: string;
  test_id: string;
  student_id: string;
  score: number; // 0–100
  passed: boolean;
  answers: Record<string, string>;
  attempted_at: string;
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  student_id: string;
  role: ChatRole;
  content: string;
  node_context_id: string | null;
  created_at: string;
};

// ─── Coding Practice ──────────────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";

export type CodingChallenge = {
  id: string;
  student_id: string;
  language: string;
  topic: string;
  difficulty: Difficulty;
  problem_statement: string;
  starter_code: string;
  student_submission: string | null;
  evaluation_result: EvaluationResult | null;
  status: "pending" | "submitted" | "evaluated" | "pending_evaluation";
  xp_awarded: number;
  created_at: string;
};

export type EvaluationResult = {
  passed: boolean;
  feedback: string;
  correctness_score: number;
  style_score: number;
  xp_earned: number;
};

// ─── Gamification ─────────────────────────────────────────────────────────────

export type Badge = {
  id: string;
  student_id: string;
  name: string;
  description: string;
  icon: string;
  awarded_at: string;
};

// ─── Progress ─────────────────────────────────────────────────────────────────

export type ProgressRecord = {
  student_id: string;
  roadmaps_completed: number;
  nodes_completed: number;
  milestone_tests_taken: number;
  milestone_tests_avg_score: number;
  coding_challenges_completed: number;
  updated_at: string;
};

export type ActivityDataPoint = {
  date: string;
  challenges_completed: number;
  nodes_completed: number;
};

// ─── Assessment ───────────────────────────────────────────────────────────────

export type AssessmentQuestion = {
  id: string;
  question: string;
  type: "single_choice" | "multi_choice" | "scale";
  options: string[];
};

export type AssessmentAnswer = {
  question_id: string;
  answer: string | string[];
};

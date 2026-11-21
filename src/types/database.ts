// Supabase database types generated from schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationships = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}[];

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          xp_total: number;
          streak_count: number;
          credits: number;
          last_active_date: string | null;
          onboarded_at: string | null;
          show_on_leaderboard: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          xp_total?: number;
          streak_count?: number;
          credits?: number;
          last_active_date?: string | null;
          onboarded_at?: string | null;
          show_on_leaderboard?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          xp_total?: number;
          streak_count?: number;
          credits?: number;
          last_active_date?: string | null;
          onboarded_at?: string | null;
          show_on_leaderboard?: boolean;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      careers: {
        Row: {
          id: string;
          title: string;
          description: string;
          demand_indicator: "High" | "Medium" | "Low";
          salary_min: number;
          salary_max: number;
          salary_currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          demand_indicator: "High" | "Medium" | "Low";
          salary_min?: number;
          salary_max?: number;
          salary_currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          demand_indicator?: "High" | "Medium" | "Low";
          salary_min?: number;
          salary_max?: number;
          salary_currency?: string;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      assessment_questions: {
        Row: {
          id: string;
          question: string;
          type: "single_choice" | "multi_choice" | "scale";
          options: string[];
          position: number;
          slug: string | null;
          is_core: boolean;
        };
        Insert: {
          id?: string;
          question: string;
          type: "single_choice" | "multi_choice" | "scale";
          options?: string[];
          position?: number;
          slug?: string | null;
          is_core?: boolean;
        };
        Update: {
          id?: string;
          question?: string;
          type?: "single_choice" | "multi_choice" | "scale";
          options?: string[];
          position?: number;
          slug?: string | null;
          is_core?: boolean;
        };
        Relationships: Relationships;
      };
      assessments: {
        Row: {
          id: string;
          student_id: string;
          answers: Json;
          skill_profile: Json;
          suggestions: Json;
          used_fallback: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          answers: Json;
          skill_profile: Json;
          suggestions: Json;
          used_fallback?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          answers?: Json;
          skill_profile?: Json;
          suggestions?: Json;
          used_fallback?: boolean;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      roadmaps: {
        Row: {
          id: string;
          student_id: string;
          career_id: string | null;
          title: string;
          completion_percentage: number;
          used_fallback: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          career_id?: string | null;
          title: string;
          completion_percentage?: number;
          used_fallback?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          career_id?: string | null;
          title?: string;
          completion_percentage?: number;
          used_fallback?: boolean;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      nodes: {
        Row: {
          id: string;
          roadmap_id: string;
          title: string;
          description: string;
          position: number;
          section_index: number;
          parent_id: string | null;
          branch_side: "left" | "right" | null;
        };
        Insert: {
          id?: string;
          roadmap_id: string;
          title: string;
          description?: string;
          position?: number;
          section_index?: number;
          parent_id?: string | null;
          branch_side?: "left" | "right" | null;
        };
        Update: {
          id?: string;
          roadmap_id?: string;
          title?: string;
          description?: string;
          position?: number;
          section_index?: number;
          parent_id?: string | null;
          branch_side?: "left" | "right" | null;
        };
        Relationships: Relationships;
      };
      node_completions: {
        Row: {
          id: string;
          node_id: string;
          student_id: string;
          is_completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          node_id: string;
          student_id: string;
          is_completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          node_id?: string;
          student_id?: string;
          is_completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: Relationships;
      };
      resources: {
        Row: {
          id: string;
          node_id: string;
          title: string;
          type: "video" | "article" | "note";
          url: string | null;
          content: string | null;
          link_status: number | null;
          link_kind: "direct" | "search" | "none" | null;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          node_id: string;
          title: string;
          type: "video" | "article" | "note";
          url?: string | null;
          content?: string | null;
          link_status?: number | null;
          link_kind?: "direct" | "search" | "none" | null;
          verified_at?: string | null;
        };
        Update: {
          id?: string;
          node_id?: string;
          title?: string;
          type?: "video" | "article" | "note";
          url?: string | null;
          content?: string | null;
          link_status?: number | null;
          link_kind?: "direct" | "search" | "none" | null;
          verified_at?: string | null;
        };
        Relationships: Relationships;
      };
      node_tasks: {
        Row: {
          id: string;
          node_id: string;
          title: string;
          position: number;
        };
        Insert: {
          id?: string;
          node_id: string;
          title: string;
          position?: number;
        };
        Update: {
          id?: string;
          node_id?: string;
          title?: string;
          position?: number;
        };
        Relationships: Relationships;
      };
      node_task_completions: {
        Row: {
          id: string;
          task_id: string;
          student_id: string;
          is_completed: boolean;
        };
        Insert: {
          id?: string;
          task_id: string;
          student_id: string;
          is_completed?: boolean;
        };
        Update: {
          id?: string;
          task_id?: string;
          student_id?: string;
          is_completed?: boolean;
        };
        Relationships: Relationships;
      };
      milestone_tests: {
        Row: {
          id: string;
          roadmap_id: string;
          section_index: number;
          type: "mcq" | "qa" | "coding";
          title: string;
          questions: unknown;
          used_fallback: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          roadmap_id: string;
          section_index?: number;
          type: "mcq" | "qa" | "coding";
          title: string;
          questions?: unknown;
          used_fallback?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          roadmap_id?: string;
          section_index?: number;
          type?: "mcq" | "qa" | "coding";
          title?: string;
          questions?: unknown;
          used_fallback?: boolean;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      milestone_test_attempts: {
        Row: {
          id: string;
          test_id: string;
          student_id: string;
          score: number;
          passed: boolean;
          answers: unknown;
          attempted_at: string;
          session_id: string | null;
          practice: boolean;
        };
        Insert: {
          id?: string;
          test_id: string;
          student_id: string;
          score?: number;
          passed?: boolean;
          answers?: unknown;
          attempted_at?: string;
          session_id?: string | null;
          practice?: boolean;
        };
        Update: {
          id?: string;
          test_id?: string;
          student_id?: string;
          score?: number;
          passed?: boolean;
          answers?: unknown;
          attempted_at?: string;
          session_id?: string | null;
          practice?: boolean;
        };
        Relationships: Relationships;
      };
      unlocked_sections: {
        Row: {
          id: string;
          student_id: string;
          roadmap_id: string;
          section_index: number;
        };
        Insert: {
          id?: string;
          student_id: string;
          roadmap_id: string;
          section_index?: number;
        };
        Update: {
          id?: string;
          student_id?: string;
          roadmap_id?: string;
          section_index?: number;
        };
        Relationships: Relationships;
      };
      ai_events: {
        Row: {
          id: string;
          feature: string;
          kind: "call" | "fallback";
          ok: boolean;
          latency_ms: number | null;
          prompt_chars: number | null;
          response_chars: number | null;
          error: string | null;
          student_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          feature: string;
          kind: "call" | "fallback";
          ok: boolean;
          latency_ms?: number | null;
          prompt_chars?: number | null;
          response_chars?: number | null;
          error?: string | null;
          student_id?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: Relationships;
      };
      ai_feedback: {
        Row: {
          id: string;
          student_id: string;
          feature: string;
          target_id: string;
          rating: -1 | 1;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          feature: string;
          target_id: string;
          rating: -1 | 1;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          rating?: -1 | 1;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      chat_messages: {
        Row: {
          id: string;
          student_id: string;
          role: "user" | "assistant";
          content: string;
          node_context_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          role: "user" | "assistant";
          content: string;
          node_context_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          role?: "user" | "assistant";
          content?: string;
          node_context_id?: string | null;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      coding_challenge_secrets: {
        Row: { challenge_id: string; tests: unknown; reference_solution: string | null; created_at: string };
        Insert: { challenge_id: string; tests: unknown; reference_solution?: string | null; created_at?: string };
        Update: { challenge_id?: string; tests?: unknown; reference_solution?: string | null; created_at?: string };
        Relationships: Relationships;
      };
      coding_submissions: {
        Row: {
          id: string; challenge_id: string; student_id: string; kind: "run" | "submit"; code: string;
          passed: boolean; tests_passed: number; tests_total: number; correctness: number;
          style_score: number | null; feedback: string | null; results: unknown; compile_error: string | null;
          runtime_ms: number | null; memory_kb: number | null; used_fallback: boolean; xp_awarded: number; created_at: string;
        };
        Insert: {
          id?: string; challenge_id: string; student_id: string; kind: "run" | "submit"; code: string;
          passed?: boolean; tests_passed?: number; tests_total?: number; correctness?: number;
          style_score?: number | null; feedback?: string | null; results?: unknown; compile_error?: string | null;
          runtime_ms?: number | null; memory_kb?: number | null; used_fallback?: boolean; xp_awarded?: number; created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coding_submissions"]["Insert"]>;
        Relationships: Relationships;
      };
      coding_challenges: {
        Row: {
          id: string;
          student_id: string;
          language: string;
          topic: string;
          difficulty: "easy" | "medium" | "hard";
          problem_statement: string;
          starter_code: string;
          student_submission: string | null;
          evaluation_result: unknown | null;
          status: "pending" | "submitted" | "evaluated" | "pending_evaluation";
          xp_awarded: number;
          used_fallback: boolean;
          title: string | null;
          examples: unknown;
          validated: boolean;
          first_passed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          language: string;
          topic: string;
          difficulty: "easy" | "medium" | "hard";
          problem_statement: string;
          starter_code?: string;
          student_submission?: string | null;
          evaluation_result?: unknown | null;
          status?: "pending" | "submitted" | "evaluated" | "pending_evaluation";
          xp_awarded?: number;
          used_fallback?: boolean;
          title?: string | null;
          examples?: unknown;
          validated?: boolean;
          first_passed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          language?: string;
          topic?: string;
          difficulty?: "easy" | "medium" | "hard";
          problem_statement?: string;
          starter_code?: string;
          student_submission?: string | null;
          evaluation_result?: unknown | null;
          status?: "pending" | "submitted" | "evaluated" | "pending_evaluation";
          xp_awarded?: number;
          used_fallback?: boolean;
          title?: string | null;
          examples?: unknown;
          validated?: boolean;
          first_passed_at?: string | null;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      badges: {
        Row: {
          id: string;
          student_id: string;
          name: string;
          description: string;
          icon: string;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          name: string;
          description: string;
          icon?: string;
          awarded_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          name?: string;
          description?: string;
          icon?: string;
          awarded_at?: string;
        };
        Relationships: Relationships;
      };
      progress_records: {
        Row: {
          student_id: string;
          roadmaps_completed: number;
          nodes_completed: number;
          milestone_tests_taken: number;
          milestone_tests_avg_score: number;
          coding_challenges_completed: number;
          updated_at: string;
        };
        Insert: {
          student_id: string;
          roadmaps_completed?: number;
          nodes_completed?: number;
          milestone_tests_taken?: number;
          milestone_tests_avg_score?: number;
          coding_challenges_completed?: number;
          updated_at?: string;
        };
        Update: {
          student_id?: string;
          roadmaps_completed?: number;
          nodes_completed?: number;
          milestone_tests_taken?: number;
          milestone_tests_avg_score?: number;
          coding_challenges_completed?: number;
          updated_at?: string;
        };
        Relationships: Relationships;
      };
      credit_transactions: {
        Row: {
          id: string;
          student_id: string;
          amount: number;
          reason: string;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          amount: number;
          reason: string;
          balance_after: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          amount?: number;
          reason?: string;
          balance_after?: number;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      notifications: {
        Row: {
          id: string;
          student_id: string;
          type: string;
          title: string;
          body: string;
          href: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          type?: string;
          title: string;
          body?: string;
          href?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          type?: string;
          title?: string;
          body?: string;
          href?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      certificates: {
        Row: {
          id: string;
          student_id: string;
          roadmap_id: string;
          code: string;
          title: string;
          level: string;
          recipient_name: string;
          issued_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          roadmap_id: string;
          code: string;
          title: string;
          level?: string;
          recipient_name: string;
          issued_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          roadmap_id?: string;
          code?: string;
          title?: string;
          level?: string;
          recipient_name?: string;
          issued_at?: string;
        };
        Relationships: Relationships;
      };
      project_blueprints: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          tagline: string;
          inputs: Json;
          graph: Json;
          used_fallback: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          tagline?: string;
          inputs?: Json;
          graph?: Json;
          used_fallback?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          tagline?: string;
          inputs?: Json;
          graph?: Json;
          used_fallback?: boolean;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      blueprint_node_completions: {
        Row: {
          blueprint_id: string;
          student_id: string;
          node_key: string;
          is_completed: boolean;
          completed_at: string;
        };
        Insert: {
          blueprint_id: string;
          student_id: string;
          node_key: string;
          is_completed?: boolean;
          completed_at?: string;
        };
        Update: {
          blueprint_id?: string;
          student_id?: string;
          node_key?: string;
          is_completed?: boolean;
          completed_at?: string;
        };
        Relationships: Relationships;
      };
      xp_events: {
        Row: {
          id: string;
          student_id: string;
          amount: number;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          amount: number;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          amount?: number;
          reason?: string;
          created_at?: string;
        };
        Relationships: Relationships;
      };
      milestone_test_sessions: {
        Row: {
          id: string;
          test_id: string;
          student_id: string;
          questions: Json;
          used_fallback: boolean;
          created_at: string;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          test_id: string;
          student_id: string;
          questions?: Json;
          used_fallback?: boolean;
          created_at?: string;
          submitted_at?: string | null;
        };
        Update: {
          submitted_at?: string | null;
        };
        Relationships: Relationships;
      };
      milestone_question_results: {
        Row: {
          id: string;
          attempt_id: string;
          student_id: string;
          question_id: string;
          position: number;
          node_id: string | null;
          type: "mcq" | "short";
          question: string;
          options: Json | null;
          student_answer: string;
          correct_answer: string | null;
          is_correct: boolean;
          score: number;
          feedback: string | null;
          explanation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          student_id: string;
          question_id: string;
          position?: number;
          node_id?: string | null;
          type: "mcq" | "short";
          question: string;
          options?: Json | null;
          student_answer?: string;
          correct_answer?: string | null;
          is_correct?: boolean;
          score?: number;
          feedback?: string | null;
          explanation?: string | null;
          created_at?: string;
        };
        Update: {
          explanation?: string | null;
        };
        Relationships: Relationships;
      };
      review_items: {
        Row: {
          id: string;
          student_id: string;
          node_id: string;
          roadmap_id: string;
          stage: number;
          due_date: string;
          lapses: number;
          last_reviewed_at: string | null;
          source_attempt_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          node_id: string;
          roadmap_id: string;
          stage?: number;
          due_date: string;
          lapses?: number;
          last_reviewed_at?: string | null;
          source_attempt_id?: string | null;
          created_at?: string;
        };
        Update: {
          stage?: number;
          due_date?: string;
          lapses?: number;
          last_reviewed_at?: string | null;
          source_attempt_id?: string | null;
        };
        Relationships: Relationships;
      };
      remedial_plans: {
        Row: {
          node_id: string;
          student_id: string;
          explanation: string;
          practice_task: string;
          check_questions: Json;
          used_fallback: boolean;
          created_at: string;
        };
        Insert: {
          node_id: string;
          student_id: string;
          explanation: string;
          practice_task: string;
          check_questions?: Json;
          used_fallback?: boolean;
          created_at?: string;
        };
        Update: {
          explanation?: string;
          practice_task?: string;
          check_questions?: Json;
          used_fallback?: boolean;
        };
        Relationships: Relationships;
      };
      study_time_events: {
        Row: {
          id: string;
          student_id: string;
          node_id: string | null;
          minutes: number;
          kind: string | null;
          day: string | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          node_id?: string | null;
          minutes?: number;
          kind?: string | null;
          day?: string | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          node_id?: string | null;
          minutes?: number;
          kind?: string | null;
          day?: string | null;
          recorded_at?: string;
        };
        Relationships: Relationships;
      };
      internships: {
        Row: {
          id: string;
          source: string;
          source_id: string;
          title: string;
          company: string;
          city: string | null;
          is_remote: boolean;
          is_trainee: boolean;
          field: "software" | "data_ai" | "design" | "marketing" | "finance" | "hr" | "engineering" | "other";
          stipend: string | null;
          is_paid: boolean | null;
          description: string | null;
          apply_url: string;
          posted_at: string | null;
          deadline: string | null;
          first_seen_at: string;
          last_seen_at: string;
          last_checked_at: string;
          missed_runs: number;
          is_active: boolean;
          dedupe_key: string;
        };
        // Written only by the scraper (service role).
        Insert: never;
        Update: never;
        Relationships: Relationships;
      };
      saved_internships: {
        Row: { student_id: string; internship_id: string; created_at: string };
        Insert: { student_id: string; internship_id: string; created_at?: string };
        Update: { student_id?: string; internship_id?: string; created_at?: string };
        Relationships: Relationships;
      };
    };
    Views: Record<string, never>;
    Functions: {
      // service_role only; atomic insert of a whole roadmap (migration 012)
      create_roadmap: {
        Args: { p_student_id: string; p_payload: Json };
        Returns: string;
      };
      spend_credits: {
        Args: { p_student_id: string; p_amount: number; p_reason: string };
        // null when the student cannot afford the charge
        Returns: number | null;
      };
      add_credits: {
        Args: { p_student_id: string; p_amount: number; p_reason: string };
        Returns: number | null;
      };
      award_xp: {
        Args: { p_student_id: string; p_amount: number; p_reason: string };
        // new xp_total, null when the student row doesn't exist
        Returns: number | null;
      };
      get_leaderboard: {
        Args: { p_period: string; p_viewer: string; p_limit?: number };
        // rank is null for the viewer's own row when hidden or without XP in the period
        Returns: {
          rank: number | null;
          display_name: string;
          avatar_initial: string;
          xp: number;
          streak: number;
          is_me: boolean;
        }[];
      };
      record_study_heartbeat: {
        Args: { p_student_id: string; p_kind: string };
        // false when a minute was already recorded in the last 50 s
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
};

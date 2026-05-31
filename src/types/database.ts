// Supabase database types generated from schema

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
          last_active_date: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          xp_total?: number;
          streak_count?: number;
          last_active_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          xp_total?: number;
          streak_count?: number;
          last_active_date?: string | null;
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
        };
        Insert: {
          id?: string;
          question: string;
          type: "single_choice" | "multi_choice" | "scale";
          options?: string[];
          position?: number;
        };
        Update: {
          id?: string;
          question?: string;
          type?: "single_choice" | "multi_choice" | "scale";
          options?: string[];
          position?: number;
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
        };
        Insert: {
          id?: string;
          roadmap_id: string;
          title: string;
          description?: string;
          position?: number;
          section_index?: number;
        };
        Update: {
          id?: string;
          roadmap_id?: string;
          title?: string;
          description?: string;
          position?: number;
          section_index?: number;
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
        };
        Insert: {
          id?: string;
          node_id: string;
          title: string;
          type: "video" | "article" | "note";
          url?: string | null;
          content?: string | null;
        };
        Update: {
          id?: string;
          node_id?: string;
          title?: string;
          type?: "video" | "article" | "note";
          url?: string | null;
          content?: string | null;
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
        };
        Insert: {
          id?: string;
          test_id: string;
          student_id: string;
          score?: number;
          passed?: boolean;
          answers?: unknown;
          attempted_at?: string;
        };
        Update: {
          id?: string;
          test_id?: string;
          student_id?: string;
          score?: number;
          passed?: boolean;
          answers?: unknown;
          attempted_at?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

import { createClient } from "@/lib/supabase/server";
import type { Career, AssessmentQuestion } from "@/types";

export async function getAssessmentQuestions(): Promise<AssessmentQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_questions")
    .select("*")
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AssessmentQuestion[];
}

export async function getCareers(): Promise<Career[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("careers")
    .select("*")
    .order("title", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Career[];
}

export async function getCareerById(id: string): Promise<Career | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("careers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Career;
}

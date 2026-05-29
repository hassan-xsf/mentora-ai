-- Enable RLS on all tables
alter table students enable row level security;
alter table careers enable row level security;
alter table assessment_questions enable row level security;
alter table roadmaps enable row level security;
alter table nodes enable row level security;
alter table node_completions enable row level security;
alter table resources enable row level security;
alter table node_tasks enable row level security;
alter table node_task_completions enable row level security;
alter table milestone_tests enable row level security;
alter table milestone_test_attempts enable row level security;
alter table unlocked_sections enable row level security;
alter table chat_messages enable row level security;
alter table coding_challenges enable row level security;
alter table badges enable row level security;
alter table progress_records enable row level security;
alter table study_time_events enable row level security;

-- Students: own row only
create policy "students_own" on students for all using (auth.uid() = id);

-- Careers: public read
create policy "careers_read" on careers for select using (true);

-- Assessment questions: public read
create policy "assessment_questions_read" on assessment_questions for select using (true);

-- Roadmaps: own only
create policy "roadmaps_own" on roadmaps for all using (auth.uid() = student_id);

-- Nodes: accessible if student owns the roadmap
create policy "nodes_own_roadmap" on nodes for select using (
  exists (select 1 from roadmaps where roadmaps.id = nodes.roadmap_id and roadmaps.student_id = auth.uid())
);

-- Node completions: own only
create policy "node_completions_own" on node_completions for all using (auth.uid() = student_id);

-- Resources: accessible via owned roadmap
create policy "resources_own_roadmap" on resources for select using (
  exists (
    select 1 from nodes
    join roadmaps on roadmaps.id = nodes.roadmap_id
    where nodes.id = resources.node_id and roadmaps.student_id = auth.uid()
  )
);

-- Node tasks: accessible via owned roadmap
create policy "node_tasks_own_roadmap" on node_tasks for select using (
  exists (
    select 1 from nodes
    join roadmaps on roadmaps.id = nodes.roadmap_id
    where nodes.id = node_tasks.node_id and roadmaps.student_id = auth.uid()
  )
);

-- Node task completions: own only
create policy "node_task_completions_own" on node_task_completions for all using (auth.uid() = student_id);

-- Milestone tests: accessible via owned roadmap
create policy "milestone_tests_own_roadmap" on milestone_tests for all using (
  exists (select 1 from roadmaps where roadmaps.id = milestone_tests.roadmap_id and roadmaps.student_id = auth.uid())
);

-- Milestone test attempts: own only
create policy "milestone_test_attempts_own" on milestone_test_attempts for all using (auth.uid() = student_id);

-- Unlocked sections: own only
create policy "unlocked_sections_own" on unlocked_sections for all using (auth.uid() = student_id);

-- Chat messages: own only
create policy "chat_messages_own" on chat_messages for all using (auth.uid() = student_id);

-- Coding challenges: own only
create policy "coding_challenges_own" on coding_challenges for all using (auth.uid() = student_id);

-- Badges: own only
create policy "badges_own" on badges for all using (auth.uid() = student_id);

-- Progress records: own only
create policy "progress_records_own" on progress_records for all using (auth.uid() = student_id);

-- Study time events: own only
create policy "study_time_events_own" on study_time_events for all using (auth.uid() = student_id);

-- ============================================================
-- AI Student Platform — Full Database Setup
-- Run this entire file once in the Supabase SQL Editor
-- ============================================================


-- ─── EXTENSIONS ──────────────────────────────────────────────

create extension if not exists "uuid-ossp";


-- ─── SCHEMA ──────────────────────────────────────────────────

-- Students (mirrors auth.users)
create table students (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  xp_total integer not null default 0,
  streak_count integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

-- Careers
create table careers (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  demand_indicator text not null check (demand_indicator in ('High','Medium','Low')),
  salary_min integer not null default 0,
  salary_max integer not null default 0,
  salary_currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- Assessment questions
create table assessment_questions (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  type text not null check (type in ('single_choice','multi_choice','scale')),
  options jsonb not null default '[]',
  position integer not null default 0
);

-- Roadmaps
create table roadmaps (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  career_id uuid references careers(id) on delete set null,
  title text not null,
  completion_percentage integer not null default 0,
  created_at timestamptz not null default now()
);

-- Nodes
create table nodes (
  id uuid primary key default uuid_generate_v4(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  title text not null,
  description text not null default '',
  position integer not null default 0,
  section_index integer not null default 0
);

-- Node completion per student
create table node_completions (
  id uuid primary key default uuid_generate_v4(),
  node_id uuid not null references nodes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  unique(node_id, student_id)
);

-- Resources
create table resources (
  id uuid primary key default uuid_generate_v4(),
  node_id uuid not null references nodes(id) on delete cascade,
  title text not null,
  type text not null check (type in ('video','article','note')),
  url text,
  content text
);

-- Node tasks
create table node_tasks (
  id uuid primary key default uuid_generate_v4(),
  node_id uuid not null references nodes(id) on delete cascade,
  title text not null,
  position integer not null default 0
);

-- Node task completions
create table node_task_completions (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references node_tasks(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  is_completed boolean not null default false,
  unique(task_id, student_id)
);

-- Milestone tests
create table milestone_tests (
  id uuid primary key default uuid_generate_v4(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  section_index integer not null default 0,
  type text not null check (type in ('mcq','qa','coding')),
  title text not null,
  questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Milestone test attempts
create table milestone_test_attempts (
  id uuid primary key default uuid_generate_v4(),
  test_id uuid not null references milestone_tests(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  score integer not null default 0,
  passed boolean not null default false,
  answers jsonb not null default '{}',
  attempted_at timestamptz not null default now()
);

-- Unlocked sections per student per roadmap
create table unlocked_sections (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  section_index integer not null default 0,
  unique(student_id, roadmap_id, section_index)
);

-- Chat messages
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  node_context_id uuid references nodes(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Coding challenges
create table coding_challenges (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  language text not null,
  topic text not null,
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  problem_statement text not null,
  starter_code text not null default '',
  student_submission text,
  evaluation_result jsonb,
  status text not null default 'pending' check (status in ('pending','submitted','evaluated','pending_evaluation')),
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

-- Badges
create table badges (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  name text not null,
  description text not null,
  icon text not null default '🏆',
  awarded_at timestamptz not null default now()
);

-- Progress records
create table progress_records (
  student_id uuid primary key references students(id) on delete cascade,
  study_hours_total numeric not null default 0,
  roadmaps_completed integer not null default 0,
  nodes_completed integer not null default 0,
  milestone_tests_taken integer not null default 0,
  milestone_tests_avg_score numeric not null default 0,
  coding_challenges_completed integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Study time events
create table study_time_events (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  node_id uuid references nodes(id) on delete set null,
  minutes integer not null default 0,
  recorded_at timestamptz not null default now()
);


-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

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

-- Nodes: select + insert/update/delete if student owns the roadmap
create policy "nodes_own_roadmap" on nodes for select using (
  exists (select 1 from roadmaps where roadmaps.id = nodes.roadmap_id and roadmaps.student_id = auth.uid())
);
create policy "nodes_insert_own_roadmap" on nodes for insert with check (
  exists (select 1 from roadmaps where roadmaps.id = nodes.roadmap_id and roadmaps.student_id = auth.uid())
);
create policy "nodes_update_own_roadmap" on nodes for update using (
  exists (select 1 from roadmaps where roadmaps.id = nodes.roadmap_id and roadmaps.student_id = auth.uid())
);
create policy "nodes_delete_own_roadmap" on nodes for delete using (
  exists (select 1 from roadmaps where roadmaps.id = nodes.roadmap_id and roadmaps.student_id = auth.uid())
);

-- Node completions: own only
create policy "node_completions_own" on node_completions for all using (auth.uid() = student_id);

-- Resources: select + insert/update/delete via owned roadmap
create policy "resources_own_roadmap" on resources for select using (
  exists (
    select 1 from nodes
    join roadmaps on roadmaps.id = nodes.roadmap_id
    where nodes.id = resources.node_id and roadmaps.student_id = auth.uid()
  )
);
create policy "resources_insert_own_roadmap" on resources for insert with check (
  exists (
    select 1 from nodes
    join roadmaps on roadmaps.id = nodes.roadmap_id
    where nodes.id = resources.node_id and roadmaps.student_id = auth.uid()
  )
);

-- Node tasks: select + insert/update/delete via owned roadmap
create policy "node_tasks_own_roadmap" on node_tasks for select using (
  exists (
    select 1 from nodes
    join roadmaps on roadmaps.id = nodes.roadmap_id
    where nodes.id = node_tasks.node_id and roadmaps.student_id = auth.uid()
  )
);
create policy "node_tasks_insert_own_roadmap" on node_tasks for insert with check (
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


-- ─── INDEXES ─────────────────────────────────────────────────

create index if not exists idx_roadmaps_student_id on roadmaps(student_id);
create index if not exists idx_nodes_roadmap_id on nodes(roadmap_id);
create index if not exists idx_node_completions_student_node on node_completions(student_id, node_id);
create index if not exists idx_chat_messages_student_created on chat_messages(student_id, created_at);
create index if not exists idx_coding_challenges_student_id on coding_challenges(student_id);
create index if not exists idx_study_time_events_student_recorded on study_time_events(student_id, recorded_at);
create index if not exists idx_milestone_test_attempts_student_test on milestone_test_attempts(student_id, test_id);


-- ─── AUTH TRIGGER ─────────────────────────────────────────────
-- Auto-creates a students row whenever a new user signs up

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.students (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── SEED DATA ────────────────────────────────────────────────

insert into careers (title, description, demand_indicator, salary_min, salary_max, salary_currency) values
  ('Software Engineer', 'Design, develop, and maintain software applications across various domains including web, mobile, and backend systems. Work with modern frameworks and tools to build scalable solutions.', 'High', 85000, 160000, 'USD'),
  ('Data Scientist', 'Analyze large datasets to extract insights, build predictive models, and support data-driven decision making. Work with Python, R, machine learning frameworks, and statistical methods.', 'High', 90000, 155000, 'USD'),
  ('UX Designer', 'Create user-centered designs through research, wireframing, prototyping, and usability testing. Collaborate with product and engineering teams to deliver intuitive digital experiences.', 'Medium', 75000, 130000, 'USD'),
  ('DevOps Engineer', 'Bridge development and operations by automating deployments, managing CI/CD pipelines, and maintaining cloud infrastructure. Expert in Docker, Kubernetes, and cloud platforms.', 'High', 95000, 165000, 'USD'),
  ('Cybersecurity Analyst', 'Protect organizational systems and data by monitoring threats, conducting vulnerability assessments, and implementing security measures. Work with SIEM tools and incident response.', 'High', 80000, 145000, 'USD'),
  ('Product Manager', 'Define product vision, prioritize features, and coordinate cross-functional teams to deliver products that meet user needs and business objectives. Bridge technical and business worlds.', 'Medium', 90000, 160000, 'USD'),
  ('AI/ML Engineer', 'Build and deploy machine learning models and AI systems at scale. Work on model training, optimization, MLOps pipelines, and integrating AI capabilities into production applications.', 'High', 110000, 185000, 'USD'),
  ('Full Stack Developer', 'Build complete web applications from frontend interfaces to backend APIs and databases. Proficient in both client-side and server-side technologies across the full development stack.', 'High', 80000, 150000, 'USD');

insert into assessment_questions (question, type, options, position) values
  ('What type of work excites you most?', 'single_choice', '["Building and creating new things", "Analyzing data to find patterns", "Designing intuitive user experiences", "Solving security and infrastructure challenges"]', 0),
  ('Which subjects do you enjoy most?', 'multi_choice', '["Mathematics and Statistics", "Computer Science and Programming", "Design and Visual Arts", "Psychology and Human Behavior", "Business and Strategy"]', 1),
  ('How comfortable are you with programming?', 'scale', '["Complete beginner", "Some basics", "Intermediate", "Advanced", "Expert"]', 2),
  ('What is your preferred working style?', 'single_choice', '["Working independently on deep technical problems", "Collaborating closely with a team", "A mix of solo and team work", "Leading and coordinating others"]', 3),
  ('Which best describes your career goal?', 'single_choice', '["High salary and financial stability", "Making a creative impact", "Solving challenging technical problems", "Building products people love", "Advancing cutting-edge technology"]', 4),
  ('How do you feel about working with data?', 'scale', '["Dislike it", "Neutral", "Enjoy basic analysis", "Love working with data", "Passionate about data science"]', 5),
  ('What size company would you prefer?', 'single_choice', '["Startup (1-50 people)", "Mid-size company (50-500)", "Large corporation (500+)", "Remote/freelance", "No preference"]', 6),
  ('Which technical area interests you most?', 'single_choice', '["Frontend web development", "Backend systems and APIs", "Machine learning and AI", "Security and networking", "Cloud and infrastructure", "Mobile development"]', 7),
  ('How important is work-life balance to you?', 'scale', '["Not important - I want to go all in", "Somewhat important", "Moderately important", "Very important", "Critical - it is my top priority"]', 8),
  ('What best describes your problem-solving approach?', 'single_choice', '["Systematic and methodical - I follow a process", "Creative and experimental - I try new things", "Collaborative - I prefer to think with others", "Research-driven - I study before acting"]', 9);

-- Enable UUID extension
create extension if not exists "uuid-ossp";

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

-- ============================================================
-- 009 Saved, explainable career assessments
-- ============================================================

-- The question bank now lives here (it used to be hardcoded in the form) so the
-- server can validate submitted answers against it. `slug` is the stable key the
-- scoring weights in src/lib/assessment/profile.ts are keyed on; the original
-- generic seed rows have no slug and are no longer shown.
alter table assessment_questions add column if not exists slug text unique;
alter table assessment_questions add column if not exists is_core boolean not null default false;

insert into assessment_questions (slug, is_core, position, type, question, options) values
  ('coding_level', true, 0, 'single_choice', 'What is the most complex thing you have personally built with code?',
   '["Nothing yet — I have not written code outside a tutorial", "Small scripts or exercises that solve one problem", "A working app or site I finished on my own", "A multi-part project with a database, users, or an API", "Something used by real people, or work I was paid for"]'),
  ('math_comfort', true, 1, 'single_choice', 'How far did you get with maths, and how did it feel?',
   '["I avoid maths and want a path with as little as possible", "I can handle it when it has a clear practical purpose", "Comfortable with statistics and probability", "Comfortable with calculus and linear algebra", "Maths is a strength — proofs and theory are enjoyable"]'),
  ('energy_source', true, 2, 'multi_choice', 'Which of these tasks would you happily do for a whole day?',
   '["Chasing down why something is broken until it works", "Making an interface look and feel exactly right", "Digging through a messy dataset for the real story", "Designing how parts of a large system fit together", "Automating a boring manual process away", "Talking to users and turning their needs into a plan", "Breaking into something to prove it is not secure", "Explaining a hard concept so others finally get it"]'),
  ('drain_source', true, 3, 'multi_choice', 'Which of these would drain you fastest?',
   '["Long meetings and stakeholder alignment", "Pixel-level visual polish", "Heavy maths and statistics", "Being on call for production incidents", "Reading dense documentation and specifications", "Repetitive, well-defined tasks with no ambiguity", "Presenting and persuading in front of a group"]'),
  ('time_commitment', true, 4, 'single_choice', 'Realistically, how many hours a week can you study?',
   '["Under 5 — I need a slow, steady path", "5-10 hours alongside other commitments", "10-20 hours, this is a serious focus", "20+ hours, I am going at this full time"]'),
  ('horizon', true, 5, 'single_choice', 'When do you need to be job-ready?',
   '["Within 6 months — fastest route to employable", "About a year", "2+ years, I am still studying", "No deadline — depth matters more than speed"]'),
  ('learning_style', true, 6, 'single_choice', 'How do you actually learn best?',
   '["Building projects and looking things up as I hit them", "Structured courses worked through in order", "Reading documentation and books first, then applying", "Video walkthroughs I can follow along with", "Working through problem sets and challenges"]'),
  ('motivation', true, 7, 'single_choice', 'What would make a job feel worth it five years in?',
   '["Strong pay and financial security", "Deep technical mastery and respect for the craft", "Building products that people visibly use", "Autonomy and flexibility over my time", "Work that has a social or scientific impact", "Leading teams and shaping direction"]'),
  ('ambiguity', false, 8, 'scale', 'You are handed a vague problem with no clear right answer. That feels…',
   '["Stressful — I want clear requirements", "Uncomfortable but manageable", "Fine, I will find a direction", "Good — this is where I do my best work", "Ideal — ambiguity is the interesting part"]'),
  ('debug_patience', false, 9, 'single_choice', 'A bug has resisted you for three hours. What is your honest reaction?',
   '["Frustrated — I would want to hand it off", "I push on but it wears me down", "I take a break and come back methodically", "I get more stubborn the longer it takes"]'),
  ('visual_sense', false, 10, 'scale', 'How strong is your eye for visual detail and layout?',
   '["Weak — I cannot tell why something looks off", "Below average", "Average — I notice obvious problems", "Strong — bad spacing bothers me", "Very strong — I redesign things in my head"]'),
  ('people_facing', false, 11, 'scale', 'How much of your week do you want spent with other people?',
   '["Almost none — deep solo focus", "Mostly solo with occasional check-ins", "An even split", "Mostly collaborative", "Constant contact — people are the job"]'),
  ('risk_tolerance', false, 12, 'single_choice', 'Which first job would you take?',
   '["Stable large employer, clear ladder, predictable work", "Established mid-size company with room to move", "Early startup — more chaos, more ownership", "Freelance or contract work I source myself", "Research, academia, or an open-source funded role"]'),
  ('domain_pull', false, 13, 'multi_choice', 'Which of these problem spaces genuinely interests you?',
   '["Health and medicine", "Finance and markets", "Games and entertainment", "Climate and energy", "Education", "Robotics and hardware", "Security and privacy", "Developer tools and infrastructure", "No strong preference — the work matters more"]'),
  ('writing', false, 14, 'scale', 'How do you feel about writing — docs, explanations, proposals?',
   '["I avoid it", "I can do it but would rather not", "Neutral", "I am comfortable and reasonably good at it", "It is one of my strengths"]'),
  ('tools_touched', false, 15, 'multi_choice', 'Which of these have you actually used, even briefly?',
   '["Git and GitHub", "A terminal or command line", "HTML and CSS", "Python", "JavaScript or TypeScript", "SQL or a database", "A spreadsheet for real analysis", "Figma or another design tool", "Cloud services (AWS, GCP, Azure)", "None of these yet"]'),
  ('feedback_loop', false, 16, 'single_choice', 'What kind of progress keeps you going?',
   '["Seeing something visible change immediately", "A test suite going green", "A number improving — speed, accuracy, cost", "Someone telling me the thing helped them", "Finally understanding a concept that was opaque"]'),
  ('credential_path', false, 17, 'single_choice', 'What is your situation with formal credentials?',
   '["In a computing or engineering degree now", "In a degree in a different field", "Degree finished, changing direction", "No degree — self-taught route", "Bootcamp or certificate route"]')
on conflict (slug) do update set
  is_core = excluded.is_core,
  position = excluded.position,
  type = excluded.type,
  question = excluded.question,
  options = excluded.options;

-- One row per completed assessment. Written only by the server action (admin
-- client) after the answers are validated and credits charged, so a refresh of
-- the results page never re-runs the AI or re-charges.
create table if not exists assessments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  -- [{ question_id, slug, question, answer }]
  answers jsonb not null,
  -- deterministic output of computeProfile(): { scores, evidence, constraints }
  skill_profile jsonb not null,
  -- AI (or fallback) career suggestions
  suggestions jsonb not null,
  used_fallback boolean not null default false,
  created_at timestamptz not null default now()
);

alter table assessments enable row level security;

drop policy if exists "assessments_select_own" on assessments;
create policy "assessments_select_own" on assessments
  for select to authenticated using (auth.uid() = student_id);

create index if not exists idx_assessments_student_created
  on assessments(student_id, created_at desc);

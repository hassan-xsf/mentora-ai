-- Track when AI fell back to canned content so the UI can surface it.
-- Run this in the Supabase SQL editor.

alter table roadmaps
  add column if not exists used_fallback boolean not null default false;

alter table milestone_tests
  add column if not exists used_fallback boolean not null default false;

alter table coding_challenges
  add column if not exists used_fallback boolean not null default false;

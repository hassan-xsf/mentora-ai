-- ============================================================
-- Onboarding tour flag
-- Null = the student has not finished/skipped the first-visit dashboard tour.
-- Written only by server code (admin client) after auth; students can already
-- read their own row via the existing students select policy.
-- ============================================================

alter table students add column if not exists onboarded_at timestamptz;

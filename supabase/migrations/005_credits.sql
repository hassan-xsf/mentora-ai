-- ============================================================
-- Credits system
-- Run in the Supabase SQL editor (after 000_full_setup.sql)
-- ============================================================

-- Balance lives on the student row; ledger explains how it got there.
alter table students add column if not exists credits integer not null default 1000;

create table if not exists credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  -- positive = granted/purchased, negative = spent
  amount integer not null,
  -- 'signup_bonus' | 'purchase' | a CreditAction key from src/lib/credits/config.ts
  reason text not null,
  balance_after integer not null,
  created_at timestamptz not null default now()
);

alter table credit_transactions enable row level security;
create policy "credit_transactions_own" on credit_transactions
  for all using (auth.uid() = student_id);

create index if not exists idx_credit_transactions_student_created
  on credit_transactions(student_id, created_at desc);

-- Atomic spend: returns the new balance, or null when the student can't afford it.
-- Does the check and the decrement in one statement so two concurrent AI calls
-- can't both pass the check and overdraw.
create or replace function public.spend_credits(
  p_student_id uuid,
  p_amount integer,
  p_reason text
)
returns integer as $$
declare
  v_balance integer;
begin
  update students
     set credits = credits - p_amount
   where id = p_student_id
     and credits >= p_amount
  returning credits into v_balance;

  if v_balance is null then
    return null;
  end if;

  insert into credit_transactions (student_id, amount, reason, balance_after)
  values (p_student_id, -p_amount, p_reason, v_balance);

  return v_balance;
end;
$$ language plpgsql security definer;

create or replace function public.add_credits(
  p_student_id uuid,
  p_amount integer,
  p_reason text
)
returns integer as $$
declare
  v_balance integer;
begin
  update students
     set credits = credits + p_amount
   where id = p_student_id
  returning credits into v_balance;

  if v_balance is null then
    return null;
  end if;

  insert into credit_transactions (student_id, amount, reason, balance_after)
  values (p_student_id, p_amount, p_reason, v_balance);

  return v_balance;
end;
$$ language plpgsql security definer;

-- New signups get the free grant logged, not just defaulted.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.students (id, email, full_name, credits)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    1000
  );

  insert into public.credit_transactions (student_id, amount, reason, balance_after)
  values (new.id, 1000, 'signup_bonus', 1000);

  return new;
end;
$$ language plpgsql security definer;

-- ─── BACKFILL ────────────────────────────────────────────────
-- Existing students predate the credits column. The `default 1000` above only
-- applies to new rows in some paths, so grant + log the bonus explicitly for
-- anyone who has no credit history yet.
insert into credit_transactions (student_id, amount, reason, balance_after)
select s.id, 1000, 'signup_bonus', 1000
  from students s
 where not exists (
   select 1 from credit_transactions ct where ct.student_id = s.id
 );

update students s
   set credits = 1000
 where not exists (
   select 1 from credit_transactions ct
    where ct.student_id = s.id and ct.reason <> 'signup_bonus'
 );

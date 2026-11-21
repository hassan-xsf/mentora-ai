-- ============================================================
-- 015 Leaderboard + study time
-- Run after 008_security_hardening.sql (needs xp_events). Idempotent.
-- ============================================================

-- ─── Leaderboard opt-out ────────────────────────────────────
alter table students add column if not exists show_on_leaderboard boolean not null default true;

-- Weekly / monthly / all-time ranking. Never exposes ids or emails: rows carry
-- a privacy-safe name ("Ayesha K." or "Learner #1234") and an is_me flag.
-- Returns the top p_limit visible students plus the viewer's own row, even when
-- the viewer is outside the top or hidden / unranked (then rank is null).
create or replace function public.get_leaderboard(
  p_period text,        -- 'week' | 'month' | 'all'
  p_viewer uuid,
  p_limit integer default 20
)
returns table (
  rank integer,
  display_name text,
  avatar_initial text,
  xp integer,
  streak integer,
  is_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    -- Week starts Monday 00:00 Pakistan time; month on the 1st.
    select case p_period
             when 'week'  then date_trunc('week',  now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi'
             when 'month' then date_trunc('month', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi'
           end as since,
           (now() at time zone 'Asia/Karachi')::date as today
  ),
  period_xp as (
    select e.student_id, sum(e.amount)::integer as xp
      from xp_events e, bounds b
     where b.since is not null and e.created_at >= b.since
     group by e.student_id
  ),
  scored as (
    select s.id, s.full_name, s.show_on_leaderboard,
           case when p_period = 'all' then s.xp_total else coalesce(p.xp, 0) end as xp,
           -- a streak whose last active day is before yesterday is already broken
           case when s.last_active_date >= b.today - 1 then s.streak_count else 0 end as streak
      from students s
      cross join bounds b
      left join period_xp p on p.student_id = s.id
  ),
  ranked as (
    select sc.*,
           rank() over (order by sc.xp desc)::integer as rnk,
           row_number() over (order by sc.xp desc, sc.id) as pos
      from scored sc
     where sc.show_on_leaderboard and sc.xp > 0
  ),
  picked as (
    select r.id, r.full_name, r.xp, r.streak, r.rnk
      from ranked r
     where r.pos <= p_limit or r.id = p_viewer
    union all
    select sc.id, sc.full_name, sc.xp, sc.streak, null::integer
      from scored sc
     where sc.id = p_viewer
       and not exists (select 1 from ranked r where r.id = p_viewer)
  ),
  named as (
    select pk.*,
           case
             when coalesce(btrim(pk.full_name), '') = '' then
               'Learner #' || lpad((((hashtext(pk.id::text)::bigint % 10000) + 10000) % 10000)::text, 4, '0')
             when array_length(w.parts, 1) = 1 then left(w.parts[1], 24)
             else left(w.parts[1], 24) || ' ' || upper(left(w.parts[array_length(w.parts, 1)], 1)) || '.'
           end as name
      from picked pk
      cross join lateral (select regexp_split_to_array(btrim(pk.full_name), '\s+') as parts) w
  )
  select n.rnk, n.name, upper(left(n.name, 1)), n.xp, n.streak, n.id = p_viewer
    from named n
   where p_period in ('week', 'month', 'all')
   order by n.rnk nulls last, n.xp desc, n.name
$$;

revoke execute on function public.get_leaderboard(text, uuid, integer) from public, anon, authenticated;
grant execute on function public.get_leaderboard(text, uuid, integer) to service_role;

-- ─── Study time ─────────────────────────────────────────────
-- 000 created study_time_events (student_id, node_id, minutes, recorded_at)
-- but nothing wrote to it. It now holds one row per student, Pakistan day and
-- kind (where the time was spent); minutes grows by one per heartbeat and
-- recorded_at is the last heartbeat. Keeps the table at days x kinds rows.
alter table study_time_events add column if not exists kind text;
alter table study_time_events add column if not exists day date;
create unique index if not exists uq_study_time_events_student_day_kind
  on study_time_events(student_id, day, kind);

-- Records one active minute. Returns false (and writes nothing) when the
-- student already got a minute in the last 50 s, so several open tabs or a
-- tampered client can't inflate study time. The advisory lock serialises
-- concurrent heartbeats of the same student.
create or replace function public.record_study_heartbeat(
  p_student_id uuid,
  p_kind text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind is null or p_kind not in ('roadmap', 'practice', 'review', 'test', 'build') then
    raise exception 'record_study_heartbeat: invalid kind';
  end if;

  perform pg_advisory_xact_lock(hashtext('study_heartbeat:' || p_student_id::text));

  if exists (
    select 1 from study_time_events
     where student_id = p_student_id
       and recorded_at > now() - interval '50 seconds'
  ) then
    return false;
  end if;

  insert into study_time_events (student_id, day, kind, minutes, recorded_at)
  values (p_student_id, (now() at time zone 'Asia/Karachi')::date, p_kind, 1, now())
  on conflict (student_id, day, kind)
  do update set minutes = study_time_events.minutes + 1, recorded_at = excluded.recorded_at;
  return true;
end;
$$;

revoke execute on function public.record_study_heartbeat(uuid, text) from public, anon, authenticated;
grant execute on function public.record_study_heartbeat(uuid, text) to service_role;

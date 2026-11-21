-- RLS / privilege checks for the security model in 008_security_hardening.sql.
-- LOCAL ONLY (inserts fixture users into auth.users, then rolls everything back).
-- Usage:
--   KEEP=1 bash scripts/db/validate.sh          # note the db name it prints
--   docker exec -i mentora-pg psql -U postgres -d <db> -v ON_ERROR_STOP=1 -q < scripts/db/policy-check.sql
-- Every check prints "ok ..."; the first failure aborts with "FAIL ...".
\set ON_ERROR_STOP 1
\o /dev/null
begin;

-- Passes if the statement is refused by privileges or touches 0 rows.
create function pg_temp.expect_denied(label text, q text) returns void language plpgsql as $$
declare n int;
begin
  execute q;
  get diagnostics n = row_count;
  if n > 0 then raise exception 'FAIL %: % row(s) affected', label, n; end if;
  raise notice 'ok   % (0 rows)', label;
exception when insufficient_privilege then
  raise notice 'ok   % (permission denied)', label;
end $$;

create function pg_temp.expect_rows(label text, q text, expected int) returns void language plpgsql as $$
declare n int;
begin
  execute 'select count(*) from (' || q || ') s' into n;
  if n <> expected then raise exception 'FAIL %: got % row(s), expected %', label, n, expected; end if;
  raise notice 'ok   % (% rows)', label, n;
end $$;

-- ─── fixtures (as owner) ─────────────────────────────────────
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'alice@example.com', '{"full_name":"Alice"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bob@example.com',   '{"full_name":"Bob"}');
insert into roadmaps (id, student_id, title) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Alice map'),
  ('bbbbbbbb-1111-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'Bob map');
insert into nodes (id, roadmap_id, title) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'A node'),
  ('bbbbbbbb-2222-0000-0000-000000000002', 'bbbbbbbb-1111-0000-0000-000000000002', 'B node');
insert into node_tasks (node_id, title) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'A task'),
  ('bbbbbbbb-2222-0000-0000-000000000002', 'B task');
insert into milestone_tests (roadmap_id, type, title, questions) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'mcq', 'A test', '[{"correct":"secret"}]');
insert into certificates (student_id, roadmap_id, code, title, recipient_name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'MNT-AAAA-AAAA', 'Alice map', 'Alice'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-1111-0000-0000-000000000002', 'MNT-BBBB-BBBB', 'Bob map', 'Bob');
insert into notifications (student_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'hi');

-- ─── signed in as Alice ──────────────────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';

select pg_temp.expect_rows('own student row readable', 'select * from students', 1);
select pg_temp.expect_rows('own roadmap only', 'select * from roadmaps', 1);
select pg_temp.expect_rows('own nodes only', 'select * from nodes', 1);
select pg_temp.expect_rows('own node_tasks only', 'select * from node_tasks', 1);
select pg_temp.expect_rows('own certificates only', 'select * from certificates', 1);
select pg_temp.expect_rows('own credit ledger readable', 'select * from credit_transactions', 1);
select pg_temp.expect_rows('own notifications readable', 'select * from notifications', 1);
select pg_temp.expect_rows('milestone_tests hidden (answers)', 'select * from milestone_tests', 0);
select pg_temp.expect_rows('careers public', 'select * from careers', (select count(*)::int from careers));

select pg_temp.expect_denied('update own credits', $q$update students set credits = 999999 where id = auth.uid()$q$);
select pg_temp.expect_denied('update own xp', $q$update students set xp_total = 999999 where id = auth.uid()$q$);
select pg_temp.expect_denied('insert certificate', $q$insert into certificates (student_id, roadmap_id, code, title, recipient_name) values (auth.uid(), 'bbbbbbbb-1111-0000-0000-000000000002', 'MNT-EVIL-EVIL', 'x', 'x')$q$);
select pg_temp.expect_denied('insert credit tx', $q$insert into credit_transactions (student_id, amount, reason, balance_after) values (auth.uid(), 1, 'x', 1)$q$);
select pg_temp.expect_denied('insert xp_events', $q$insert into xp_events (student_id, amount, reason) values (auth.uid(), 1000, 'x')$q$);
select pg_temp.expect_denied('insert node into own roadmap', $q$insert into nodes (roadmap_id, title) values ('aaaaaaaa-1111-0000-0000-000000000001', 'x')$q$);
select pg_temp.expect_denied('upsert node completion', $q$insert into node_completions (node_id, student_id, is_completed) values ('aaaaaaaa-2222-0000-0000-000000000001', auth.uid(), true)$q$);
select pg_temp.expect_denied('update own roadmap %', $q$update roadmaps set completion_percentage = 100$q$);
select pg_temp.expect_denied('delete own notification', $q$delete from notifications$q$);
select pg_temp.expect_denied('call add_credits', $q$select public.add_credits(auth.uid(), 100000, 'x')$q$);
select pg_temp.expect_denied('call spend_credits', $q$select public.spend_credits(auth.uid(), 1, 'x')$q$);
select pg_temp.expect_denied('call award_xp', $q$select public.award_xp(auth.uid(), 100000, 'x')$q$);

-- ─── anonymous (publishable key, not signed in) ──────────────
set local role anon;
set local request.jwt.claim.sub = '';

select pg_temp.expect_rows('anon: certificates hidden', 'select * from certificates', 0);
select pg_temp.expect_rows('anon: students hidden', 'select * from students', 0);
select pg_temp.expect_rows('anon: careers public', 'select * from careers', (select count(*)::int from careers));
select pg_temp.expect_denied('anon: call add_credits', $q$select public.add_credits('aaaaaaaa-0000-0000-0000-000000000001', 100000, 'x')$q$);
select pg_temp.expect_denied('anon: insert certificate', $q$insert into certificates (student_id, roadmap_id, code, title, recipient_name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000002', 'MNT-EVIL-EVI2', 'x', 'x')$q$);

-- ─── service role (server code) still works ──────────────────
set local role service_role;

select pg_temp.expect_rows('service: award_xp returns total',
  $q$select 1 where public.award_xp('aaaaaaaa-0000-0000-0000-000000000001', 25, 'check') = 25$q$, 1);
select pg_temp.expect_rows('service: xp ledger row written',
  $q$select * from xp_events where student_id = 'aaaaaaaa-0000-0000-0000-000000000001' and reason = 'check'$q$, 1);
select pg_temp.expect_rows('service: add_credits works',
  $q$select 1 where public.add_credits('aaaaaaaa-0000-0000-0000-000000000001', 5, 'check') = 1005$q$, 1);
do $$ begin
  perform public.add_credits('aaaaaaaa-0000-0000-0000-000000000001', -5, 'check');
  raise exception 'FAIL service: negative add_credits accepted';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok   service: negative add_credits rejected';
end $$;
do $$ begin
  perform public.award_xp('aaaaaaaa-0000-0000-0000-000000000001', 0, 'check');
  raise exception 'FAIL service: zero award_xp accepted';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok   service: zero award_xp rejected';
end $$;

rollback;
\echo 'policy-check: all checks passed'

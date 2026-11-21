-- 012: verified resource links + atomic roadmap creation.
--
-- resources.link_kind:  'direct' = URL was checked and is live
--                       'search' = URL unverifiable/missing, url holds an honest search link
--                       'none'   = no link (self-authored note)
-- NULL link_kind = row created before verification existed (UI treats it as unverified).

alter table resources
  add column if not exists link_status integer,
  add column if not exists link_kind text check (link_kind in ('direct', 'search', 'none')),
  add column if not exists verified_at timestamptz;

-- Insert one node with its resources and tasks. Internal helper for create_roadmap.
create or replace function public.create_roadmap_node(
  p_roadmap_id uuid,
  p_node jsonb,
  p_position integer,
  p_section_index integer,
  p_parent_id uuid,
  p_branch_side text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into nodes (roadmap_id, title, description, position, section_index, parent_id, branch_side)
  values (
    p_roadmap_id,
    coalesce(nullif(p_node->>'title', ''), 'Untitled topic'),
    coalesce(p_node->>'description', ''),
    p_position,
    p_section_index,
    p_parent_id,
    p_branch_side
  )
  returning id into v_id;

  insert into resources (node_id, title, type, url, content, link_status, link_kind, verified_at)
  select
    v_id,
    r->>'title',
    case when r->>'type' in ('video', 'article', 'note') then r->>'type' else 'article' end,
    nullif(r->>'url', ''),
    null,
    (r->>'link_status')::integer,
    r->>'link_kind',
    (r->>'verified_at')::timestamptz
  from jsonb_array_elements(coalesce(p_node->'resources', '[]'::jsonb)) as r
  where coalesce(r->>'title', '') <> '';

  insert into node_tasks (node_id, title, position)
  select v_id, t->>'title', (ord - 1)::integer
  from jsonb_array_elements(coalesce(p_node->'tasks', '[]'::jsonb)) with ordinality as x(t, ord)
  where coalesce(t->>'title', '') <> '';

  return v_id;
end;
$$;

-- Create a whole roadmap in one transaction: roadmap, trunk + child nodes,
-- resources, tasks, one milestone test per section and the section-0 unlock.
-- Any failure rolls everything back, so a roadmap is never half-written.
-- Payload: {"title","used_fallback","sections":[{"title","nodes":[{"title","description",
--   "resources":[{"title","type","url","link_kind","link_status","verified_at"}],
--   "tasks":[{"title"}],"children":[<node without children>]}]}]}
create or replace function public.create_roadmap(p_student_id uuid, p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roadmap_id uuid;
  v_trunk_id uuid;
  s record;
  n record;
  c record;
begin
  if jsonb_typeof(p_payload->'sections') is distinct from 'array'
     or jsonb_array_length(p_payload->'sections') = 0 then
    raise exception 'create_roadmap: payload has no sections';
  end if;

  insert into roadmaps (student_id, title, completion_percentage, used_fallback)
  values (
    p_student_id,
    coalesce(nullif(p_payload->>'title', ''), 'Learning Roadmap'),
    0,
    coalesce((p_payload->>'used_fallback')::boolean, false)
  )
  returning id into v_roadmap_id;

  for s in
    select value as section, (ordinality - 1)::integer as idx
    from jsonb_array_elements(p_payload->'sections') with ordinality
  loop
    for n in
      select value as node, (ordinality - 1)::integer as idx
      from jsonb_array_elements(coalesce(s.section->'nodes', '[]'::jsonb)) with ordinality
    loop
      v_trunk_id := public.create_roadmap_node(v_roadmap_id, n.node, n.idx, s.idx, null, null);

      -- Children alternate sides so the tree balances.
      for c in
        select value as node, (ordinality - 1)::integer as idx
        from jsonb_array_elements(coalesce(n.node->'children', '[]'::jsonb)) with ordinality
      loop
        perform public.create_roadmap_node(
          v_roadmap_id, c.node, c.idx, s.idx, v_trunk_id,
          case when c.idx % 2 = 0 then 'right' else 'left' end
        );
      end loop;
    end loop;

    insert into milestone_tests (roadmap_id, section_index, type, title, questions)
    values (
      v_roadmap_id,
      s.idx,
      'mcq',
      coalesce(nullif(s.section->>'title', ''), 'Section ' || (s.idx + 1)) || ' Milestone Test',
      '[]'::jsonb
    );
  end loop;

  insert into unlocked_sections (student_id, roadmap_id, section_index)
  values (p_student_id, v_roadmap_id, 0)
  on conflict do nothing;

  return v_roadmap_id;
end;
$$;

revoke execute on function public.create_roadmap_node(uuid, jsonb, integer, integer, uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_roadmap_node(uuid, jsonb, integer, integer, uuid, text)
  to service_role;
revoke execute on function public.create_roadmap(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_roadmap(uuid, jsonb) to service_role;

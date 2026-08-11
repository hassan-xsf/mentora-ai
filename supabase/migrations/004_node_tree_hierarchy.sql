-- Add parent/child hierarchy to nodes so roadmaps render as a branching tree.
-- Trunk nodes  = parent_id IS NULL (central spine, ordered by section_index, position)
-- Branch nodes = parent_id references a trunk node; branch_side controls which
--                side of the trunk they fan out to ('left' | 'right').

alter table nodes
  add column if not exists parent_id uuid references nodes(id) on delete cascade,
  add column if not exists branch_side text check (branch_side in ('left', 'right'));

create index if not exists idx_nodes_parent_id on nodes(parent_id);

-- Standard Supabase project: access is governed by existing RLS policies on
-- `nodes` (see 002_rls_policies.sql). No custom role grants needed for new columns.

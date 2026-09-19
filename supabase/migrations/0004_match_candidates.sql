-- Forward-only. Run after 0003.
--
-- Every vendor findMatches() evaluates, not only the ones that became a match. Without this
-- the funnel is lost: sellers filtered out on terms, and sellers the model scored below the
-- threshold, left no trace at all, so a vendor could never be told why it is not being shown.
--
-- One row per (problem, seller): re-running findMatches on the same problem updates the row
-- instead of inflating the count, so "considered N times" means N distinct problems.
create table match_candidates (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references problems(id) on delete cascade,
  seller_company_id uuid not null references companies(id) on delete cascade,
  cleared_terms boolean not null,
  compatibility_json jsonb,    -- Compatibility: why it failed, when it did
  score int,                   -- null when it never reached the model
  became_match boolean not null default false,
  created_at timestamptz not null default now()
);

-- The upsert in findMatches() conflicts on this pair, so the constraint must be unique.
create unique index match_candidates_problem_seller on match_candidates (problem_id, seller_company_id);
create index match_candidates_seller on match_candidates (seller_company_id);

-- No policies on purpose. This table is the one place that knows which buyer considered which
-- vendor, so no client may read it: it is written and aggregated by the service role only, and
-- a vendor sees counts about itself, never the problems or buyers behind them.
alter table match_candidates enable row level security;

-- findMatches() inserted unconditionally, so running it twice on one problem produced a second
-- copy of every match. Now that a screen has a button for it, a double click would do exactly
-- that. The action skips vendors already matched; this index is the guarantee behind it.
create unique index matches_problem_seller on matches (problem_id, seller_company_id);

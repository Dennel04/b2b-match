-- B2B Match schema. Announce in the team chat before changing it.

create extension if not exists "pgcrypto";

create type company_role as enum ('seller', 'buyer', 'both');
create type match_status as enum ('proposed', 'buyer_interested', 'accepted', 'declined');
create type urgency_level as enum ('low', 'medium', 'high');

create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website text,
  role company_role not null default 'both',
  profile_json jsonb,
  seller_terms jsonb,       -- SellerTerms: deal floor, contract formats, availability, capabilities
  created_at timestamptz not null default now()
);

-- Private table. Owner-only reads. Matching runs server-side with the service role key.
create table problems (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  text text not null,
  interview_json jsonb,
  buyer_terms jsonb,        -- BuyerTerms: budget ceiling, formats, timing, requirements
  urgency urgency_level not null default 'medium',
  created_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  buyer_company_id uuid not null references companies(id) on delete cascade,
  seller_company_id uuid not null references companies(id) on delete cascade,
  problem_id uuid not null references problems(id) on delete cascade,
  score int not null check (score between 0 and 100),
  reasoning_public text not null,
  compatibility_json jsonb,   -- result of the mechanical terms check
  agent_dialogue_json jsonb,  -- transcript of the agent negotiation
  deal_envelope_json jsonb,   -- what the agents settled on
  status match_status not null default 'proposed',
  brief_md text,
  created_at timestamptz not null default now()
);

create index on companies (owner_id);
create index on problems (company_id);
create index on matches (buyer_company_id);
create index on matches (seller_company_id);

alter table companies enable row level security;
alter table problems  enable row level security;
alter table matches   enable row level security;

-- Any authenticated user can read company profiles (that is the storefront); owner writes.
create policy companies_read on companies for select to authenticated using (true);
create policy companies_write on companies for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Problems: company owner only. No exceptions.
create policy problems_owner on problems for all to authenticated
  using (exists (select 1 from companies c where c.id = problems.company_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from companies c where c.id = problems.company_id and c.owner_id = auth.uid()));

-- A match is visible to either party.
create policy matches_participant on matches for select to authenticated
  using (exists (
    select 1 from companies c
    where c.owner_id = auth.uid()
      and c.id in (matches.buyer_company_id, matches.seller_company_id)
  ));

create policy matches_update on matches for update to authenticated
  using (exists (
    select 1 from companies c
    where c.owner_id = auth.uid()
      and c.id in (matches.buyer_company_id, matches.seller_company_id)
  ));

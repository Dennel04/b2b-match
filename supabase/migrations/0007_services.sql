-- One row per thing a company sells.
--
-- Until now a company had ONE seller_terms envelope, so an operator selling a call centre at
-- €2,400/month and a fibre install at €18,000/project had to state a single floor for both.
-- Whichever figure it picked, half its catalogue was matched on the wrong terms. A service
-- carries its own envelope, and a match records which one a buyer arrived through.
--
-- A service is public in the same sense a company profile is: it is the storefront, and it is
-- what buyers' problems are read against. Nothing private lives here EXCEPT `terms`, which
-- holds the seller's floor — the mirror of a buyer's ceiling, and compared the same way, by
-- the platform only. Row level security therefore splits read from write: anyone signed in
-- reads a service, only its owner writes one.
create table services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  description text not null,
  -- The part of a BUYER'S business this fixes, from the same list a problem is filed under.
  -- Free text for the same reason problems.department is: the list is a design decision.
  area text,
  terms jsonb,              -- SellerTerms: floor, formats, availability, capabilities
  interview_json jsonb,     -- the interview that produced it, like problems.interview_json
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index on services (company_id);
-- Matching walks live services across every company, so the partial index is the hot path.
create index on services (active) where active;

-- Which service a buyer arrived through. Nullable: matches made before this migration were
-- scored against the company as a whole, and they stay valid.
alter table matches add column service_id uuid references services(id) on delete set null;
create index on matches (service_id);

alter table services enable row level security;

-- The storefront half: a signed-in user reads any service, the way they read any company
-- profile. `terms` rides along, so a client must never project it for another company —
-- getMatchView() is the only path that reports on someone else's terms, and it reports
-- compatibility, never figures.
create policy services_read on services for select to authenticated using (true);

create policy services_write on services for all to authenticated
  using (exists (select 1 from companies c where c.id = services.company_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from companies c where c.id = services.company_id and c.owner_id = auth.uid()));

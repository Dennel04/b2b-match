-- Forward-only. Run after 0004.
-- The directory: public profiles of companies read off their own public websites by
-- `npm run directory`, so a new user finds real companies to browse and contact directly,
-- before anyone else has joined. These are NOT platform members: they have no owner, no terms,
-- no problems, and they never take part in matching (matching reads `companies` only).
-- Everything here is already public on the company's own site, so every signed-in user may
-- read it. Only the service role writes.

create table directory (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,              -- "mooncascade.com", the upsert key
  website text not null,                    -- the URL that was read
  name text not null,
  logo_url text,
  industry text,
  summary text,
  city text,
  country text,
  employees integer,
  founded integer,
  languages text[] not null default '{}',
  industries_served text[] not null default '{}',
  services text[] not null default '{}',
  certifications text[] not null default '{}',
  profile_json jsonb,                       -- the full CompanyProfile draft, for anything not in a column
  pages_read text[] not null default '{}',
  scraped_at timestamptz not null default now()
);

create index directory_country on directory (country);

alter table directory enable row level security;

create policy directory_read on directory for select to authenticated using (true);

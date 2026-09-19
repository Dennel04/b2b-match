-- Forward-only. Run after 0008.
--
-- Credits: the currency a seller spends to see who arrived. A buyer's interest is the thing the
-- platform actually produces, so the row exists for free and the name behind it costs coins —
-- the introduction fee from docs/RESEARCH.md §4.4, prepaid and in one currency instead of a
-- card form at the one moment a vendor is deciding whether to meet someone.
alter table companies add column credits integer not null default 0;

-- One row per (match, company) the moment it is paid for. The primary key is the receipt: a
-- second unlock of the same match is a conflict, not a second charge.
create table match_unlocks (
  match_id   uuid not null references matches(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  spent      integer not null,
  created_at timestamptz not null default now(),
  primary key (match_id, company_id)
);

alter table match_unlocks enable row level security;

-- Read your own receipts; nobody writes from a client. Spending goes through unlockMatch(),
-- the same shape as matches in 0002.
create policy match_unlocks_own on match_unlocks for select to authenticated
  using (company_id in (select id from companies where owner_id = auth.uid()));

-- What Stripe has already been paid for. The session id is the key, so replaying a success_url
-- grants nothing twice — there is no webhook, and the browser is the one that comes back.
create table credit_purchases (
  session_id text primary key,
  company_id uuid not null references companies(id) on delete cascade,
  credits    integer not null,
  cents      integer not null,
  created_at timestamptz not null default now()
);

alter table credit_purchases enable row level security;

create policy credit_purchases_own on credit_purchases for select to authenticated
  using (company_id in (select id from companies where owner_id = auth.uid()));

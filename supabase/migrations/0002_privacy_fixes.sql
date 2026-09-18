-- Forward-only. 0001 is already applied — do not edit it.
-- Two holes found in review, both in the part of the product the pitch is about.

-- 1. companies.seller_terms holds the vendor's price FLOOR. The 0001 read policy was
--    `using (true)`, so any authenticated user could select it — the exact figure we promise
--    neither side can see. A blind marketplace has no storefront to browse, so an owner reads
--    their own row and nothing else. Matching still works: it runs on the service role.
drop policy if exists companies_read on companies;

create policy companies_read_own on companies for select to authenticated
  using (owner_id = auth.uid());

-- 2. matches_update let either party write any column of a match they belong to: rewrite the
--    transcript, change the score, or jump straight to 'accepted' and skip the double opt-in.
--    Status now moves only through setMatchStatus(), which checks who is asking and what the
--    current state allows. Clients read matches; they no longer write them.
drop policy if exists matches_update on matches;

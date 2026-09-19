-- The part of the business a problem sits in. Free text, written from a fixed list in the UI;
-- the list is a design decision and may grow, so the column does not become an enum.
alter table problems add column department text;

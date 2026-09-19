-- Forward-only. Run after 0007.
--
-- Matching is no longer something a person starts. `scripts/sweep.ts` runs on a cron and a
-- match appears while nobody is looking at a screen — which is the point, but it leaves the
-- screens with no way to say "this one is new". Coming back a day later, every match looks
-- equally old.
--
-- Two columns rather than one: a match has two sides and each reads it on its own schedule.
-- A null means that side has never had the match on screen.
alter table matches add column buyer_seen_at timestamptz;
alter table matches add column seller_seen_at timestamptz;

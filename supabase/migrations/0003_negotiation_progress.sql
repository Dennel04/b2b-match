-- Forward-only. Run after 0002.
-- negotiate() now stores the transcript line by line while it runs, so a screen can show the
-- rounds as they happen. This timestamp tells "running right now" from "died mid-way": no
-- envelope and a stamp older than five minutes means abandoned, and the next call restarts it.
alter table matches add column negotiation_started_at timestamptz;

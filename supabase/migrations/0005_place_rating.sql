-- Hoppr — store raw rating + review count per place (Google's popularity
-- signal is collapsed into `popularity` for ranking, but "hidden gem"
-- detection needs the two kept apart: high rating + low review count).
alter table public.places add column if not exists rating real;
alter table public.places add column if not exists review_count integer;

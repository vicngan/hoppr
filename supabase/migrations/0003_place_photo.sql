-- Hoppr — store a Google Places photo reference per place so cards can show a
-- real venue photo (rendered client-side via the Places Photo endpoint).
alter table public.places add column if not exists photo text;

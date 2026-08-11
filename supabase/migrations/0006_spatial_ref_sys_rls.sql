-- PostGIS's spatial_ref_sys lives in public and is exposed via PostgREST.
-- Enable RLS with a public read-only policy (it's just EPSG reference data, not sensitive).
alter table public.spatial_ref_sys enable row level security;

create policy "Public read access to spatial_ref_sys"
  on public.spatial_ref_sys
  for select
  to anon, authenticated
  using (true);

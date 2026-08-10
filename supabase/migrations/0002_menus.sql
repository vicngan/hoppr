-- Hoppr — menus (Slice 3). Crowdsourced menu items per place.

create table if not exists public.menu_items (
  id text primary key,
  place_id text not null references public.places (id) on delete cascade,
  name text not null,
  price numeric,
  description text,
  section text,
  tags text[] not null default '{}',
  dietary text[] not null default '{}',
  source text not null default 'manual', -- seed | ocr | manual
  contributor uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists menu_items_place_idx on public.menu_items (place_id);

alter table public.menu_items enable row level security;

-- read by everyone; any authenticated user can contribute (photo/manual)
create policy "read menu_items" on public.menu_items for select using (true);
create policy "insert menu_items" on public.menu_items
  for insert to authenticated with check (contributor = auth.uid() or contributor is null);

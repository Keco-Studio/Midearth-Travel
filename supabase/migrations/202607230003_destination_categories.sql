create table if not exists public.destination_categories (
  id text primary key,
  title_en text not null,
  title_zh text not null,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

alter table public.destination_categories enable row level security;

drop policy if exists "Destination categories are publicly readable" on public.destination_categories;
create policy "Destination categories are publicly readable"
  on public.destination_categories for select to anon, authenticated using (true);

drop policy if exists "Current admin can insert destination categories" on public.destination_categories;
create policy "Current admin can insert destination categories"
  on public.destination_categories for insert to anon, authenticated with check (true);

drop policy if exists "Current admin can update destination categories" on public.destination_categories;
create policy "Current admin can update destination categories"
  on public.destination_categories for update to anon, authenticated using (true) with check (true);

create table if not exists public.homepage_services (
  id text primary key,
  slug text not null,
  title text not null,
  summary text not null,
  image text not null,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

alter table public.homepage_services
  add column if not exists page_content jsonb not null default '{}'::jsonb;

drop policy if exists "Current admin can delete homepage services" on public.homepage_services;
create policy "Current admin can delete homepage services"
  on public.homepage_services for delete to anon, authenticated using (true);

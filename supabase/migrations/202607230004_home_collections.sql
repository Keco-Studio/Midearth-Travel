create table if not exists public.homepage_services (
  id text primary key,
  slug text not null,
  title text not null,
  summary text not null,
  image text not null,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_testimonials (
  id text primary key,
  name text not null,
  source text not null,
  rating integer not null check (rating between 1 and 5),
  text text not null,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

alter table public.homepage_services enable row level security;
alter table public.homepage_testimonials enable row level security;

drop policy if exists "Homepage services are publicly readable" on public.homepage_services;
create policy "Homepage services are publicly readable"
  on public.homepage_services for select to anon, authenticated using (true);
drop policy if exists "Current admin can insert homepage services" on public.homepage_services;
create policy "Current admin can insert homepage services"
  on public.homepage_services for insert to anon, authenticated with check (true);
drop policy if exists "Current admin can update homepage services" on public.homepage_services;
create policy "Current admin can update homepage services"
  on public.homepage_services for update to anon, authenticated using (true) with check (true);

drop policy if exists "Homepage testimonials are publicly readable" on public.homepage_testimonials;
create policy "Homepage testimonials are publicly readable"
  on public.homepage_testimonials for select to anon, authenticated using (true);
drop policy if exists "Current admin can insert homepage testimonials" on public.homepage_testimonials;
create policy "Current admin can insert homepage testimonials"
  on public.homepage_testimonials for insert to anon, authenticated with check (true);
drop policy if exists "Current admin can update homepage testimonials" on public.homepage_testimonials;
create policy "Current admin can update homepage testimonials"
  on public.homepage_testimonials for update to anon, authenticated using (true) with check (true);

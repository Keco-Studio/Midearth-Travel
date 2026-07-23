create table if not exists public.home_modules (
  id text primary key,
  module_index integer not null,
  name text not null,
  description text not null default '',
  status text not null default 'published' check (status in ('published', 'draft', 'unpublished')),
  published_version integer not null default 1,
  draft_version integer,
  fields jsonb not null default '[]'::jsonb,
  published_data jsonb not null default '{}'::jsonb,
  draft_data jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists home_modules_module_index_idx
  on public.home_modules (module_index);

alter table public.home_modules enable row level security;

drop policy if exists "Homepage modules are publicly readable" on public.home_modules;
create policy "Homepage modules are publicly readable"
  on public.home_modules
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Current admin can insert homepage modules" on public.home_modules;
create policy "Current admin can insert homepage modules"
  on public.home_modules
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Current admin can update homepage modules" on public.home_modules;
create policy "Current admin can update homepage modules"
  on public.home_modules
  for update
  to anon, authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homepage-media',
  'homepage-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Homepage media is publicly readable" on storage.objects;
create policy "Homepage media is publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'homepage-media');

drop policy if exists "Current admin can upload homepage media" on storage.objects;
create policy "Current admin can upload homepage media"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'homepage-media');

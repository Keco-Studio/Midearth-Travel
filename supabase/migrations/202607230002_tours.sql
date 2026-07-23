create table if not exists public.tours (
  slug text primary key,
  status text not null default 'published' check (status in ('published', 'draft', 'unpublished')),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists tours_status_idx on public.tours (status);

alter table public.tours enable row level security;

drop policy if exists "Tours are publicly readable" on public.tours;
create policy "Tours are publicly readable"
  on public.tours for select to anon, authenticated using (true);

drop policy if exists "Current admin can insert tours" on public.tours;
create policy "Current admin can insert tours"
  on public.tours for insert to anon, authenticated with check (true);

drop policy if exists "Current admin can update tours" on public.tours;
create policy "Current admin can update tours"
  on public.tours for update to anon, authenticated using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tour-media',
  'tour-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Tour media is publicly readable" on storage.objects;
create policy "Tour media is publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'tour-media');

drop policy if exists "Current admin can upload tour media" on storage.objects;
create policy "Current admin can upload tour media"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'tour-media');

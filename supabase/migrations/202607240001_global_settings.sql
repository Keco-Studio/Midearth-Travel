create table if not exists public.global_settings (
  id text primary key,
  site_name text not null,
  tagline text not null,
  primary_phone_label text not null,
  primary_phone_href text not null,
  secondary_phone_label text not null,
  secondary_phone_href text not null,
  email_label text not null,
  email_href text not null,
  office_address text not null,
  updated_at timestamptz not null default now()
);

insert into public.global_settings (
  id,
  site_name,
  tagline,
  primary_phone_label,
  primary_phone_href,
  secondary_phone_label,
  secondary_phone_href,
  email_label,
  email_href,
  office_address
)
values (
  'site',
  'MidEarth',
  'Travel · Ottawa',
  '613-236-5226',
  'tel:+16132365226',
  '613-236-2323',
  'tel:+16132362323',
  'info@midearth.ca',
  'mailto:info@midearth.ca',
  'Bronson Avenue, Ottawa, Ontario'
)
on conflict (id) do nothing;

alter table public.global_settings enable row level security;

drop policy if exists "Global settings are publicly readable" on public.global_settings;
create policy "Global settings are publicly readable"
  on public.global_settings for select to anon, authenticated using (true);

drop policy if exists "Current admin can insert global settings" on public.global_settings;
create policy "Current admin can insert global settings"
  on public.global_settings for insert to anon, authenticated with check (true);

drop policy if exists "Current admin can update global settings" on public.global_settings;
create policy "Current admin can update global settings"
  on public.global_settings for update to anon, authenticated using (true) with check (true);

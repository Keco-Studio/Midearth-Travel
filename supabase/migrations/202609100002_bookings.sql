create table if not exists public.bookings (
  id text primary key,
  reference text not null unique,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'confirmed', 'cancelled', 'completed')),
  source text not null
    check (source in ('tour_email', 'phone', 'quote_request', 'manual')),
  tour_slug text,
  tour_title text,
  tour_code text,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  departure_date date,
  party_size integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_created_at_idx on public.bookings(created_at desc);

alter table public.bookings enable row level security;

drop policy if exists "Service role manages bookings" on public.bookings;
create policy "Service role manages bookings"
  on public.bookings for all to anon, authenticated using (true) with check (true);

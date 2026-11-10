alter table public.tours add column if not exists add_ons jsonb not null default '[]'::jsonb;
alter table public.bookings add column if not exists add_on_selections jsonb not null default '[]'::jsonb;

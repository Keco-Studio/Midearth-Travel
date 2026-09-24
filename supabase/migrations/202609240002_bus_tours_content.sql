alter table public.destination_categories
  add column if not exists bus_content jsonb;

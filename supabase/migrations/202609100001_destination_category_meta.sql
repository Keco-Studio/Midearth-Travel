alter table public.destination_categories
  add column if not exists summary text,
  add column if not exists image text;

alter table public.destination_categories
  add column if not exists summary_zh text;

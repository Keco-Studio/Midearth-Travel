alter table public.homepage_testimonials
  add column if not exists text_zh text;

alter table public.global_settings
  add column if not exists office_address_zh text;

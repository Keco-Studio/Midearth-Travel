alter table public.homepage_services
  add column if not exists title_zh text not null default '',
  add column if not exists summary_zh text not null default '';

alter table public.bookings
  add column if not exists locale text not null default 'en'
    check (locale in ('en', 'zh')),
  add column if not exists adult_count integer check (adult_count >= 1),
  add column if not exists child_count integer check (child_count >= 0),
  add column if not exists departure_selection text;

alter table public.payment_orders
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists confirmation_email_id text,
  add column if not exists confirmation_email_error text;

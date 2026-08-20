create table if not exists public.payment_orders (
  id text primary key,
  reference text not null unique,
  booking_id text,
  tour_slug text not null,
  fare_label text not null,
  payment_type text not null check (payment_type in ('deposit', 'balance', 'full')),
  customer_email text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'cad' check (currency = 'cad'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_orders_status_idx on public.payment_orders(status);
create index if not exists payment_orders_booking_idx on public.payment_orders(booking_id);

create table if not exists public.payment_webhook_events (
  id text primary key,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

alter table public.payment_orders enable row level security;
alter table public.payment_webhook_events enable row level security;

revoke all on public.payment_orders from anon, authenticated;
revoke all on public.payment_webhook_events from anon, authenticated;

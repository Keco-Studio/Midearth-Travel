alter table public.bookings
  add column if not exists room_count integer
    check (room_count is null or room_count >= 1);

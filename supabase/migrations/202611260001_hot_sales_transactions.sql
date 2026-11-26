create or replace function public.persist_hot_sales_state(
  p_home_module jsonb,
  p_tours jsonb,
  p_expected_home_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_home_updated_at timestamptz;
  current_tour_updated_at timestamptz;
  saved_home public.home_modules%rowtype;
  saved_tour public.tours%rowtype;
  tour_row jsonb;
  saved_tours jsonb := '[]'::jsonb;
begin
  select updated_at
  into current_home_updated_at
  from public.home_modules
  where id = p_home_module ->> 'id'
  for update;

  if found and (
    p_expected_home_updated_at is null
    or current_home_updated_at is distinct from p_expected_home_updated_at
  ) then
    raise exception 'HOT_SALES_CONFLICT'
      using errcode = '40001';
  end if;

  if not found and p_expected_home_updated_at is not null then
    raise exception 'HOT_SALES_CONFLICT'
      using errcode = '40001';
  end if;

  insert into public.home_modules (
    id,
    module_index,
    name,
    description,
    status,
    published_version,
    draft_version,
    fields,
    published_data,
    draft_data,
    updated_at
  )
  values (
    p_home_module ->> 'id',
    (p_home_module ->> 'module_index')::integer,
    p_home_module ->> 'name',
    coalesce(p_home_module ->> 'description', ''),
    p_home_module ->> 'status',
    (p_home_module ->> 'published_version')::integer,
    (p_home_module ->> 'draft_version')::integer,
    coalesce(p_home_module -> 'fields', '[]'::jsonb),
    coalesce(p_home_module -> 'published_data', '{}'::jsonb),
    p_home_module -> 'draft_data',
    (p_home_module ->> 'updated_at')::timestamptz
  )
  on conflict (id) do update set
    module_index = excluded.module_index,
    name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    published_version = excluded.published_version,
    draft_version = excluded.draft_version,
    fields = excluded.fields,
    published_data = excluded.published_data,
    draft_data = excluded.draft_data,
    updated_at = excluded.updated_at
  returning * into saved_home;

  for tour_row in
    select value
    from jsonb_array_elements(coalesce(p_tours, '[]'::jsonb))
    order by value ->> 'slug'
  loop
    if tour_row ->> 'kind' = 'promotion' then
      update public.tours as target
      set
        data = target.data || coalesce(tour_row -> 'data', '{}'::jsonb),
        updated_at = (tour_row ->> 'updated_at')::timestamptz
      where target.slug = tour_row ->> 'slug'
      returning * into saved_tour;

      if not found then
        raise exception 'HOT_SALES_TOUR_MISSING'
          using errcode = 'P0002';
      end if;
    elsif tour_row ->> 'kind' = 'tour' then
      select updated_at
      into current_tour_updated_at
      from public.tours
      where slug = tour_row ->> 'slug'
      for update;

      if found and (
        tour_row ->> 'expected_updated_at' is null
        or current_tour_updated_at is distinct from
          (tour_row ->> 'expected_updated_at')::timestamptz
      ) then
        raise exception 'HOT_SALES_TOUR_CONFLICT'
          using errcode = '40001';
      end if;

      insert into public.tours (slug, status, data, updated_at)
      values (
        tour_row ->> 'slug',
        tour_row ->> 'status',
        coalesce(tour_row -> 'data', '{}'::jsonb),
        (tour_row ->> 'updated_at')::timestamptz
      )
      on conflict (slug) do update set
        status = excluded.status,
        data = excluded.data,
        updated_at = excluded.updated_at
      returning * into saved_tour;
    else
      raise exception 'Unknown Hot Sales Tour operation'
        using errcode = '22023';
    end if;

    saved_tours := saved_tours || jsonb_build_array(to_jsonb(saved_tour));
  end loop;

  return jsonb_build_object(
    'home_module', to_jsonb(saved_home),
    'tours', saved_tours
  );
end;
$$;

revoke all on function public.persist_hot_sales_state(jsonb, jsonb, timestamptz) from public;
grant execute on function public.persist_hot_sales_state(jsonb, jsonb, timestamptz)
  to service_role;

create or replace function public.persist_tour_order(p_order jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row jsonb;
  saved_tour public.tours%rowtype;
  saved_tours jsonb := '[]'::jsonb;
begin
  for order_row in
    select value
    from jsonb_array_elements(coalesce(p_order, '[]'::jsonb))
    order by value ->> 'slug'
  loop
    update public.tours as target
    set
      data = jsonb_set(
        target.data,
        '{displayOrder}',
        to_jsonb((order_row ->> 'display_order')::integer),
        true
      ),
      updated_at = (order_row ->> 'updated_at')::timestamptz
    where target.slug = order_row ->> 'slug'
    returning * into saved_tour;

    if not found then
      raise exception 'TOUR_ORDER_TOUR_MISSING'
        using errcode = 'P0002';
    end if;

    saved_tours := saved_tours || jsonb_build_array(to_jsonb(saved_tour));
  end loop;

  return saved_tours;
end;
$$;

revoke all on function public.persist_tour_order(jsonb) from public;
grant execute on function public.persist_tour_order(jsonb) to service_role;

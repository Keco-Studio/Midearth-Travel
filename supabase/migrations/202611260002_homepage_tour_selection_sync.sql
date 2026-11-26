create or replace function public.persist_linked_homepage_tour_state(
  p_home_modules jsonb,
  p_tours jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_home_updated_at timestamptz;
  current_tour_updated_at timestamptz;
  home_entry record;
  home_operation jsonb;
  home_row jsonb;
  saved_home public.home_modules%rowtype;
  saved_home_modules jsonb := '[]'::jsonb;
  tour_entry record;
  tour_operation jsonb;
  saved_tour public.tours%rowtype;
  saved_tours jsonb := '[]'::jsonb;
begin
  -- Lock every Homepage row first, in a stable order.
  for home_entry in
    select
      value as operation,
      value -> 'row' ->> 'id' as module_id
    from jsonb_array_elements(coalesce(p_home_modules, '[]'::jsonb))
    order by module_id
  loop
    home_operation := home_entry.operation;
    current_home_updated_at := null;

    select updated_at
    into current_home_updated_at
    from public.home_modules
    where id = home_operation -> 'row' ->> 'id'
    for update;

    if not found or home_operation ->> 'expected_updated_at' is null or
      current_home_updated_at is distinct from
        (home_operation ->> 'expected_updated_at')::timestamptz
    then
      raise exception 'HOMEPAGE_SELECTION_CONFLICT'
        using errcode = '40001';
    end if;
  end loop;

  -- Only after every Homepage lock is held, lock every Tour row by slug.
  for tour_entry in
    select
      value as operation,
      value ->> 'slug' as slug
    from jsonb_array_elements(coalesce(p_tours, '[]'::jsonb))
    order by slug
  loop
    tour_operation := tour_entry.operation;
    current_tour_updated_at := null;

    select updated_at
    into current_tour_updated_at
    from public.tours
    where slug = tour_operation ->> 'slug'
    for update;

    if not found and tour_operation ->> 'kind' <> 'tour' then
      raise exception 'HOMEPAGE_SELECTION_TOUR_MISSING'
        using errcode = 'P0002';
    elsif found and tour_operation ->> 'kind' = 'tour' and (
      tour_operation ->> 'expected_updated_at' is null or
      current_tour_updated_at is distinct from
        (tour_operation ->> 'expected_updated_at')::timestamptz
    ) then
      raise exception 'HOMEPAGE_SELECTION_TOUR_CONFLICT'
        using errcode = '40001';
    end if;
  end loop;

  for home_entry in
    select
      value as operation,
      value -> 'row' ->> 'id' as module_id
    from jsonb_array_elements(coalesce(p_home_modules, '[]'::jsonb))
    order by module_id
  loop
    home_row := home_entry.operation -> 'row';

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
      home_row ->> 'id',
      (home_row ->> 'module_index')::integer,
      home_row ->> 'name',
      coalesce(home_row ->> 'description', ''),
      home_row ->> 'status',
      (home_row ->> 'published_version')::integer,
      nullif(home_row ->> 'draft_version', '')::integer,
      coalesce(home_row -> 'fields', '[]'::jsonb),
      coalesce(home_row -> 'published_data', '{}'::jsonb),
      home_row -> 'draft_data',
      (home_row ->> 'updated_at')::timestamptz
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

    saved_home_modules :=
      saved_home_modules || jsonb_build_array(to_jsonb(saved_home));
  end loop;

  for tour_entry in
    select
      value as operation,
      value ->> 'slug' as slug
    from jsonb_array_elements(coalesce(p_tours, '[]'::jsonb))
    order by slug
  loop
    tour_operation := tour_entry.operation;

    if tour_operation ->> 'kind' = 'projection' then
      update public.tours as target
      set
        data = target.data || coalesce(tour_operation -> 'data', '{}'::jsonb),
        updated_at = (tour_operation ->> 'updated_at')::timestamptz
      where target.slug = tour_operation ->> 'slug'
      returning * into saved_tour;
    elsif tour_operation ->> 'kind' = 'tour' then
      insert into public.tours (slug, status, data, updated_at)
      values (
        tour_operation ->> 'slug',
        tour_operation ->> 'status',
        coalesce(tour_operation -> 'data', '{}'::jsonb),
        (tour_operation ->> 'updated_at')::timestamptz
      )
      on conflict (slug) do update set
        status = excluded.status,
        data = excluded.data,
        updated_at = excluded.updated_at
      returning * into saved_tour;
    else
      raise exception 'Unknown linked Homepage Tour operation'
        using errcode = '22023';
    end if;

    saved_tours := saved_tours || jsonb_build_array(to_jsonb(saved_tour));
  end loop;

  return jsonb_build_object(
    'home_modules', saved_home_modules,
    'tours', saved_tours
  );
end;
$$;

revoke all on function public.persist_linked_homepage_tour_state(jsonb, jsonb)
  from public;
grant execute on function public.persist_linked_homepage_tour_state(jsonb, jsonb)
  to service_role;

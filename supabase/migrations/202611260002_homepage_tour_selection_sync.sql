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

-- Seed an ordered Top Picks list only for legacy rows where the key is absent.
-- An explicit serialized [] is an editor choice and must remain empty.
with selected_tours as (
  select coalesce(
    jsonb_agg(
      slug
      order by
        case
          when data ->> 'displayOrder' ~ '^[0-9]+$'
            then (data ->> 'displayOrder')::integer
          else 2147483647
        end,
        slug
    ),
    '[]'::jsonb
  )::text as serialized_slugs
  from public.tours
  where data ->> 'specialOffer' = 'true'
)
update public.home_modules as target
set
  published_data = jsonb_set(
    target.published_data,
    '{selectedToursData}',
    to_jsonb(selected_tours.serialized_slugs),
    true
  ),
  draft_data = case
    when target.draft_data is not null and
      not (target.draft_data ? 'selectedToursData')
    then jsonb_set(
      target.draft_data,
      '{selectedToursData}',
      to_jsonb(selected_tours.serialized_slugs),
      true
    )
    else target.draft_data
  end,
  updated_at = now()
from selected_tours
where target.id = 'toursSection'
  and not (published_data ? 'selectedToursData');

-- Project the published monthly cards back into Tour Library. Calendar order,
-- not legacy JSON order, decides which month wins for duplicate old records.
do $backfill_explore_month$
declare
  months_json jsonb := '[]'::jsonb;
begin
  begin
    select coalesce((published_data ->> 'monthsData')::jsonb, '[]'::jsonb)
    into months_json
    from public.home_modules
    where id = 'exploreByMonth';

    if jsonb_typeof(months_json) <> 'array' then
      months_json := '[]'::jsonb;
    end if;
  exception when others then
    months_json := '[]'::jsonb;
  end;

  with month_order(month, month_position) as (
    values
      ('Jan', 1),
      ('Feb', 2),
      ('Mar', 3),
      ('Apr', 4),
      ('May', 5),
      ('Jun', 6),
      ('Jul', 7),
      ('Aug', 8),
      ('Sep', 9),
      ('Oct', 10),
      ('Nov', 11),
      ('Dec', 12)
  ),
  assignments as (
    select distinct on (tour_slug)
      destination.value ->> 'tourSlug' as tour_slug,
      month_order.month
    from month_order
    join lateral jsonb_array_elements(months_json) as month_entry(value)
      on month_entry.value ->> 'month' = month_order.month
    cross join lateral jsonb_array_elements(
      coalesce(month_entry.value -> 'destinations', '[]'::jsonb)
    ) as destination(value)
    where coalesce(destination.value ->> 'tourSlug', '') <> ''
    order by tour_slug, month_order.month_position
  )
  update public.tours as target
  set
    data = jsonb_set(
      jsonb_set(
        target.data,
        '{exploreMonth}',
        to_jsonb(coalesce(
          (select assignment.month
           from assignments as assignment
           where assignment.tour_slug = target.slug),
          ''
        )),
        true
      ),
      '{travelNewsPackage}',
      to_jsonb(exists(
        select 1
        from assignments as assignment
        where assignment.tour_slug = target.slug
      )),
      true
    ),
    updated_at = now();
end;
$backfill_explore_month$;

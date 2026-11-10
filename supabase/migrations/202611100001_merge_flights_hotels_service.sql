-- Merge the legacy Flights and Hotels CMS records into one editable service.
alter table public.homepage_services
  add column if not exists legacy_source_content jsonb not null default '{}'::jsonb;

with legacy_services as (
  select
    flights.sort_order as flights_sort_order,
    hotels.sort_order as hotels_sort_order,
    flights.image as flights_image,
    hotels.image as hotels_image,
    flights.page_content as flights_page,
    hotels.page_content as hotels_page,
    to_jsonb(flights) as flights_record,
    to_jsonb(hotels) as hotels_record
  from (values (1)) as singleton(value)
  left join public.homepage_services as flights on flights.id = 'flights'
  left join public.homepage_services as hotels on hotels.id = 'hotels'
)
insert into public.homepage_services as target (
  id,
  slug,
  title,
  title_zh,
  summary,
  summary_zh,
  image,
  page_content,
  legacy_source_content,
  sort_order,
  updated_at
)
select
  'flights-hotels',
  'flights-hotels',
  'Flights & Hotels',
  '机票与酒店',
  'Competitive global airfares and hand-picked stays.',
  '全球优惠机票与精心挑选的酒店住宿。',
  coalesce(
    nullif(trim(flights_image), ''),
    nullif(trim(hotels_image), ''),
    '/american-east-coast-new-york.jpg'
  ),
  jsonb_build_object(
    'title', 'FLIGHTS & HOTELS',
    'titleZh', '机票与酒店',
    'intro', coalesce(
      nullif(
        trim(concat_ws(
          E'\n\n',
          nullif(trim(flights_page ->> 'intro'), ''),
          nullif(trim(hotels_page ->> 'intro'), '')
        )),
        ''
      ),
      'MidEarth Travel offers competitive rates on flights and hotel rooms around the world. Call 613.236.5226 / 613.236.2323 or send a Request A Quote for more information.'
    ),
    'introZh', nullif(
      trim(concat_ws(
        E'\n\n',
        nullif(trim(flights_page ->> 'introZh'), ''),
        nullif(trim(hotels_page ->> 'introZh'), '')
      )),
      ''
    ),
    'signOff', coalesce(
      nullif(trim(flights_page ->> 'signOff'), ''),
      nullif(trim(hotels_page ->> 'signOff'), ''),
      'Thanks'
    ),
    'signOffZh', coalesce(
      nullif(trim(flights_page ->> 'signOffZh'), ''),
      nullif(trim(hotels_page ->> 'signOffZh'), ''),
      ''
    ),
    'disclaimer', coalesce(
      nullif(trim(flights_page ->> 'disclaimer'), ''),
      nullif(trim(hotels_page ->> 'disclaimer'), ''),
      ''
    ),
    'disclaimerZh', coalesce(
      nullif(trim(flights_page ->> 'disclaimerZh'), ''),
      nullif(trim(hotels_page ->> 'disclaimerZh'), ''),
      ''
    ),
    'quoteLabel', 'Flights & Hotels',
    'quoteLabelZh', '机票与酒店',
    'metaTitle', 'Flights & Hotels | Midearth Travel',
    'metaTitleZh', '机票与酒店 | Midearth Travel',
    'metaDescription', 'Competitive flight fares and hotel rates worldwide. Request a quote from MidEarth Travel.',
    'metaDescriptionZh', 'Midearth Travel 提供全球优惠机票和酒店价格，欢迎提交询价。',
    'deals', coalesce((
      select jsonb_agg(
        deal || jsonb_build_object(
          'id', format('%s-%s-%s', source, coalesce(nullif(deal ->> 'id', ''), 'deal'), item_order)
        )
        order by source_order, item_order
      )
      from (
        select 1 as source_order, 'flight' as source, deal, item_order
        from jsonb_array_elements(
          case
            when jsonb_typeof(flights_page -> 'deals') = 'array' then flights_page -> 'deals'
            else '[]'::jsonb
          end
        ) with ordinality as flight_deals(deal, item_order)
        union all
        select 2 as source_order, 'hotel' as source, deal, item_order
        from jsonb_array_elements(
          case
            when jsonb_typeof(hotels_page -> 'deals') = 'array' then hotels_page -> 'deals'
            else '[]'::jsonb
          end
        ) with ordinality as hotel_deals(deal, item_order)
      ) as merged_deals
    ), '[]'::jsonb),
    'dealsZh', coalesce((
      select jsonb_agg(
        deal || jsonb_build_object(
          'id', format('%s-%s-%s', source, coalesce(nullif(deal ->> 'id', ''), 'deal'), item_order)
        )
        order by source_order, item_order
      )
      from (
        select 1 as source_order, 'flight' as source, deal, item_order
        from jsonb_array_elements(
          case
            when jsonb_typeof(flights_page -> 'dealsZh') = 'array' then flights_page -> 'dealsZh'
            else '[]'::jsonb
          end
        ) with ordinality as flight_deals(deal, item_order)
        union all
        select 2 as source_order, 'hotel' as source, deal, item_order
        from jsonb_array_elements(
          case
            when jsonb_typeof(hotels_page -> 'dealsZh') = 'array' then hotels_page -> 'dealsZh'
            else '[]'::jsonb
          end
        ) with ordinality as hotel_deals(deal, item_order)
      ) as merged_deals
    ), '[]'::jsonb)
  ),
  jsonb_strip_nulls(jsonb_build_object(
    'flights', flights_record,
    'hotels', hotels_record
  )),
  coalesce(least(flights_sort_order, hotels_sort_order), flights_sort_order, hotels_sort_order, 1),
  now()
from legacy_services
where flights_sort_order is not null or hotels_sort_order is not null
on conflict (id) do update set
  legacy_source_content = target.legacy_source_content
    || excluded.legacy_source_content;

delete from public.homepage_services as legacy
where legacy.id in ('flights', 'hotels')
  and exists (
    select 1
    from public.homepage_services as combined
    where combined.id = 'flights-hotels'
      and combined.legacy_source_content ? legacy.id
  );

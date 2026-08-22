-- Keep the source's core vehicle specifications as first-class fields.
-- `plate_series` is the local registration series (for example, PEC), not a trim level.

alter table public.raw_listings
  add column if not exists raw_colour_text text,
  add column if not exists raw_engine_size_text text,
  add column if not exists raw_plate_series_text text;

update public.raw_listings
set
  raw_colour_text = coalesce(raw_colour_text, nullif(btrim(raw_payload ->> 'colour'), '')),
  raw_engine_size_text = coalesce(raw_engine_size_text, nullif(btrim(raw_payload ->> 'engine_size'), '')),
  raw_plate_series_text = coalesce(raw_plate_series_text, nullif(btrim(raw_payload ->> 'plate_series'), ''));

alter table public.normalized_listings
  add column if not exists colour text,
  add column if not exists engine_size text,
  add column if not exists plate_series text;

update public.normalized_listings as listings
set
  colour = coalesce(listings.colour, raw.raw_colour_text),
  engine_size = coalesce(listings.engine_size, raw.raw_engine_size_text),
  plate_series = coalesce(listings.plate_series, raw.raw_plate_series_text)
from public.raw_listings as raw
where raw.id = listings.raw_listing_id;

comment on column public.normalized_listings.plate_series is
  'Local registration plate series supplied by the source, such as PEC.';

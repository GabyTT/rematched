-- Keep price numeric for filtering while recording whether a seller is open to offers.
-- The buyer view exposes only Rev Matched-approved listing facts and seller-confirmed
-- public fields. It never exposes source-site identity, URLs, contacts, or photos.

alter table public.raw_listings
  add column if not exists raw_is_negotiable boolean not null default false;

update public.raw_listings
set raw_is_negotiable =
  raw_is_negotiable
  or lower(coalesce(raw_payload ->> 'is_negotiable', 'false')) = 'true'
  or coalesce(raw_price_text, '') ~* '\mnegotiable\M';

alter table public.normalized_listings
  add column if not exists is_negotiable boolean not null default false;

update public.normalized_listings as listings
set is_negotiable = raw.raw_is_negotiable
from public.raw_listings as raw
where raw.id = listings.raw_listing_id
  and raw.raw_is_negotiable = true;

alter table public.seller_listing_submissions
  add column if not exists plate_series text,
  add column if not exists is_negotiable boolean not null default false;

-- Preserve existing seller submissions while giving current sellers the source
-- starting values they can review and correct in their portal.
update public.seller_listing_submissions as submissions
set
  plate_series = coalesce(submissions.plate_series, listings.plate_series),
  is_negotiable = submissions.is_negotiable or listings.is_negotiable
from public.normalized_listings as listings
where listings.id = submissions.normalized_listing_id;

create or replace view public.buyer_visible_listings
with (security_barrier = true)
as
select
  listings.id,
  listings.display_name,
  listings.year,
  listings.brand_name,
  listings.model_name,
  listings.body_type,
  listings.price_amount,
  listings.mileage_value,
  listings.fuel_type,
  listings.transmission_type,
  listings.location_label,
  -- Keep the previous view shape during the local transition without exposing
  -- the underlying source-record reference to buyer clients.
  null::uuid as raw_listing_id,
  nullif(btrim(submissions.public_contact_name), '') as public_contact_name,
  nullif(btrim(submissions.public_contact_phone), '') as public_contact_phone,
  coalesce(nullif(btrim(submissions.colour), ''), listings.colour) as colour,
  coalesce(nullif(btrim(submissions.engine_size), ''), listings.engine_size) as engine_size,
  coalesce(nullif(btrim(submissions.plate_series), ''), listings.plate_series) as plate_series,
  coalesce(submissions.is_negotiable, listings.is_negotiable) as is_negotiable
from public.normalized_listings as listings
left join public.seller_listing_submissions as submissions
  on submissions.normalized_listing_id = listings.id
  and submissions.status = 'submitted'
  and submissions.confirmation_accepted_at is not null
where listings.workflow_status = 'live'
  and listings.is_buyer_visible = true
  and listings.review_status = 'approved'
  and listings.recommendation_state in ('eligible', 'limited')
  and listings.availability_status = 'available';

grant select on public.buyer_visible_listings to anon, authenticated;

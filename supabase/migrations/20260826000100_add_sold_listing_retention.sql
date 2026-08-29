-- A listing can be updated for many reasons after it is sold, so updated_at is
-- not a reliable retention clock. Record the availability transition itself.
alter table public.normalized_listings
  add column if not exists sold_at timestamptz;

-- Existing sold records predate this field. Their last update is the best
-- available historical approximation; new transitions are recorded precisely.
update public.normalized_listings
set sold_at = updated_at
where availability_status = 'sold'
  and sold_at is null;

create or replace function public.set_normalized_listing_sold_at()
returns trigger
language plpgsql
as $$
begin
  if new.availability_status = 'sold'
    and (tg_op = 'INSERT' or old.availability_status is distinct from 'sold') then
    new.sold_at = now();
  elsif new.availability_status is distinct from 'sold' then
    new.sold_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists set_normalized_listing_sold_at on public.normalized_listings;
drop trigger if exists set_normalized_listing_sold_at_on_insert on public.normalized_listings;
create trigger set_normalized_listing_sold_at
before update of availability_status on public.normalized_listings
for each row execute function public.set_normalized_listing_sold_at();

create trigger set_normalized_listing_sold_at_on_insert
before insert on public.normalized_listings
for each row execute function public.set_normalized_listing_sold_at();

-- This remains a deliberately narrow buyer shape. Sold records are included
-- only so a buyer who already saved one can see its outcome briefly; buyer UI
-- keeps them out of every discovery surface.
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
  null::uuid as raw_listing_id,
  nullif(btrim(listings.public_contact_name), '') as public_contact_name,
  nullif(btrim(listings.public_contact_phone), '') as public_contact_phone,
  listings.colour,
  listings.engine_size,
  listings.plate_series,
  listings.is_negotiable,
  listings.availability_status,
  listings.sold_at
from public.normalized_listings as listings
where (
  listings.workflow_status = 'live'
  and listings.is_buyer_visible = true
  and listings.review_status = 'approved'
  and listings.recommendation_state in ('eligible', 'limited')
  and listings.availability_status = 'available'
)
or listings.availability_status = 'sold';

grant select on public.buyer_visible_listings to anon, authenticated;

-- Buyers need a way to contact the seller of a Live Rev Matched listing.
-- This view deliberately joins only the seller-confirmed public name and phone.
-- It never exposes source-site names, phones, URLs, or other source data.

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
  listings.raw_listing_id,
  nullif(btrim(submissions.public_contact_name), '') as public_contact_name,
  nullif(btrim(submissions.public_contact_phone), '') as public_contact_phone
from public.normalized_listings as listings
left join public.seller_listing_submissions as submissions
  on submissions.normalized_listing_id = listings.id
  and submissions.status = 'submitted'
  and submissions.confirmation_accepted_at is not null
where listings.is_buyer_visible = true
  and listings.review_status = 'approved'
  and listings.recommendation_state in ('eligible', 'limited')
  and listings.availability_status = 'available';

grant select on public.buyer_visible_listings to anon, authenticated;

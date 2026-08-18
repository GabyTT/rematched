-- Buyer-facing inventory is Rev Matched inventory. Source-site details and
-- source photos remain private to Admin screens, even for Live listings.

drop policy if exists "Buyers can read buyer-visible normalized listings"
  on public.normalized_listings;
drop policy if exists "Public can read buyer-visible normalized listings"
  on public.normalized_listings;
drop policy if exists "Buyers can read buyer-visible normalized listing images"
  on public.normalized_listing_images;

drop policy if exists "Buyers can read sources for buyer-visible listings"
  on public.listing_sources;
drop policy if exists "Public can read sources for buyer-visible listings"
  on public.listing_sources;

-- This view deliberately exposes only the fields a buyer needs. It uses the
-- owner permissions of the migration role, while the predicate guarantees that
-- only Live, buyer-visible records can be returned.
create or replace view public.buyer_visible_listings
with (security_barrier = true)
as
select
  id,
  display_name,
  year,
  brand_name,
  model_name,
  body_type,
  price_amount,
  mileage_value,
  fuel_type,
  transmission_type,
  location_label,
  raw_listing_id
from public.normalized_listings
where is_buyer_visible = true
  and review_status = 'approved'
  and recommendation_state in ('eligible', 'limited')
  and availability_status = 'available';

grant select on public.buyer_visible_listings to anon, authenticated;

drop policy if exists "Buyers can read approved seller media for live listings"
  on public.seller_listing_media_assets;
drop policy if exists "Public can read approved seller media for live listings"
  on public.seller_listing_media_assets;

create policy "Buyers can read approved seller media for live listings"
on public.seller_listing_media_assets
for select
to anon, authenticated
using (
  approval_status = 'approved'
  and requested_action in ('add', 'replace')
  and exists (
    select 1
    from public.buyer_visible_listings
    where buyer_visible_listings.id = seller_listing_media_assets.normalized_listing_id
  )
);

drop policy if exists "Buyers can read approved live seller media files"
  on storage.objects;
drop policy if exists "Public can read approved live seller media files"
  on storage.objects;

create policy "Buyers can read approved live seller media files"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'seller-listing-media'
  and exists (
    select 1
    from public.seller_listing_media_assets
    join public.buyer_visible_listings
      on buyer_visible_listings.id = seller_listing_media_assets.normalized_listing_id
    where seller_listing_media_assets.storage_path = storage.objects.name
      and seller_listing_media_assets.approval_status = 'approved'
      and seller_listing_media_assets.requested_action in ('add', 'replace')
  )
);

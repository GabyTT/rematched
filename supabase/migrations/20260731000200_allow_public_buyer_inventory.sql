-- Buyers can browse Live inventory before creating an account. These policies
-- expose only records that already pass every buyer-visibility gate.
-- Imported source images are intentionally not included.

create policy "Public can read buyer-visible normalized listings"
on public.normalized_listings
for select
to anon
using (
  is_buyer_visible = true
  and review_status = 'approved'
  and recommendation_state in ('eligible', 'limited')
  and availability_status = 'available'
);

create policy "Public can read sources for buyer-visible listings"
on public.listing_sources
for select
to anon
using (
  exists (
    select 1
    from public.normalized_listings
    where normalized_listings.listing_source_id = listing_sources.id
      and normalized_listings.is_buyer_visible = true
      and normalized_listings.review_status = 'approved'
      and normalized_listings.recommendation_state in ('eligible', 'limited')
      and normalized_listings.availability_status = 'available'
  )
);

create policy "Public can read approved seller media for live listings"
on public.seller_listing_media_assets
for select
to anon
using (
  approval_status = 'approved'
  and requested_action in ('add', 'replace')
  and exists (
    select 1
    from public.normalized_listings
    where normalized_listings.id = seller_listing_media_assets.normalized_listing_id
      and normalized_listings.is_buyer_visible = true
      and normalized_listings.review_status = 'approved'
      and normalized_listings.recommendation_state in ('eligible', 'limited')
      and normalized_listings.availability_status = 'available'
  )
);

create policy "Public can read approved live seller media files"
on storage.objects
for select
to anon
using (
  bucket_id = 'seller-listing-media'
  and exists (
    select 1
    from public.seller_listing_media_assets
    join public.normalized_listings
      on normalized_listings.id = seller_listing_media_assets.normalized_listing_id
    where seller_listing_media_assets.storage_path = storage.objects.name
      and seller_listing_media_assets.approval_status = 'approved'
      and seller_listing_media_assets.requested_action in ('add', 'replace')
      and normalized_listings.is_buyer_visible = true
      and normalized_listings.review_status = 'approved'
      and normalized_listings.recommendation_state in ('eligible', 'limited')
      and normalized_listings.availability_status = 'available'
  )
);

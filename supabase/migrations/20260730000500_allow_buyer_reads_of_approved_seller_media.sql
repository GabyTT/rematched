-- Buyer-facing cards may use only seller photos that an Admin has approved.
-- Imported source photos remain unavailable to buyers.

create policy "Buyers can read approved seller media for live listings"
on public.seller_listing_media_assets
for select
to authenticated
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

create policy "Buyers can read approved live seller media files"
on storage.objects
for select
to authenticated
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

-- Allow authenticated buyers to read source attribution only when that source
-- is attached to inventory that already passes the buyer-visibility gate.

create policy "Buyers can read sources for buyer-visible listings"
on public.listing_sources
for select
to authenticated
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

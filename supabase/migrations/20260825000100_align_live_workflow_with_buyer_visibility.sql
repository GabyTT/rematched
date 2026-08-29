-- A published Admin workflow state and the buyer-visible state must never
-- diverge. Publishing is still guarded by the Admin workflow route (including
-- its approved-photo check); this constraint prevents a later direct update
-- from leaving a listing labelled Live but absent from buyer inventory.

update public.normalized_listings as listings
set
  availability_status = 'available',
  is_buyer_visible = true,
  recommendation_state = 'eligible',
  review_status = 'approved'
where listings.workflow_status = 'live'
  and exists (
    select 1
    from public.seller_listing_media_assets as media
    where media.normalized_listing_id = listings.id
      and media.approval_status = 'approved'
  );

alter table public.normalized_listings
drop constraint if exists normalized_listings_live_requires_buyer_visibility_check;

alter table public.normalized_listings
add constraint normalized_listings_live_requires_buyer_visibility_check
check (
  workflow_status <> 'live'
  or (
    availability_status = 'available'
    and is_buyer_visible = true
    and review_status = 'approved'
    and recommendation_state in ('eligible', 'limited')
  )
);

-- Keep seller edits separate from the last Admin-approved listing values.
-- This lets a Live car remain stable for buyers while an Admin reviews a
-- seller's newer details.

alter table public.seller_listing_submissions
  add column if not exists admin_review_status text not null default 'pending',
  add column if not exists admin_review_note text,
  add column if not exists admin_reviewed_at timestamptz,
  add column if not exists pending_review_at timestamptz;

alter table public.seller_listing_submissions
  drop constraint if exists seller_listing_submissions_admin_review_status_check;

alter table public.seller_listing_submissions
  add constraint seller_listing_submissions_admin_review_status_check
  check (admin_review_status in ('pending', 'approved', 'rejected'));

-- Public seller contact is part of the approved buyer-facing listing, not the
-- seller's editable submission. Keeping the approved copy here means a seller
-- can propose a new contact while buyers continue seeing the last approved one.
alter table public.normalized_listings
  add column if not exists public_contact_name text,
  add column if not exists public_contact_phone text;

-- Existing submitted records should remain visible to Admin as work that may
-- need review. Drafts do not create a review task until the seller submits.
update public.seller_listing_submissions
set
  admin_review_status = case
    when exists (
      select 1 from public.normalized_listings as listings
      where listings.id = seller_listing_submissions.normalized_listing_id
        and listings.workflow_status = 'live'
    ) then 'approved'
    when status = 'submitted' then 'pending'
    else 'approved'
  end,
  pending_review_at = case
    when status = 'submitted'
      and not exists (
        select 1
        from public.normalized_listings as listings
        where listings.id = seller_listing_submissions.normalized_listing_id
          and listings.workflow_status = 'live'
      ) then coalesce(submitted_at, updated_at)
    else null
  end
where pending_review_at is null and admin_reviewed_at is null;

-- Preserve the public contact already confirmed by sellers before this review
-- state existed. Newer submitted edits will not overwrite these values until
-- an Admin accepts them.
update public.normalized_listings as listings
set
  public_contact_name = nullif(btrim(submissions.public_contact_name), ''),
  public_contact_phone = nullif(btrim(submissions.public_contact_phone), '')
from public.seller_listing_submissions as submissions
where submissions.normalized_listing_id = listings.id
  and submissions.status = 'submitted'
  and submissions.confirmation_accepted_at is not null
  and submissions.admin_review_status = 'approved'
  and (listings.public_contact_name is null or listings.public_contact_phone is null);

-- Buyer-facing values must only ever come from the Admin-approved version.
-- A seller's newer submitted draft stays private until an Admin accepts it.
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
  listings.is_negotiable
from public.normalized_listings as listings
where listings.workflow_status = 'live'
  and listings.is_buyer_visible = true
  and listings.review_status = 'approved'
  and listings.recommendation_state in ('eligible', 'limited')
  and listings.availability_status = 'available';

grant select on public.buyer_visible_listings to anon, authenticated;

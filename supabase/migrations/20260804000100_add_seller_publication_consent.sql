-- A seller's confirmation that Rev Matched may publish their vehicle is
-- separate from confirming the accuracy of the listing details.
alter table public.seller_listing_submissions
add column publication_consent_accepted_at timestamptz;

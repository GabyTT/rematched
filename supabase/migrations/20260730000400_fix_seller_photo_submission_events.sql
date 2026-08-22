-- Seller photo submissions are workflow events in their own right. The
-- original event constraint predated the seller portal and only allowed
-- seller-contact outcomes, which caused completed uploads to be rolled back.

alter table public.listing_workflow_events
  drop constraint if exists listing_workflow_events_event_type_check;

alter table public.listing_workflow_events
  add constraint listing_workflow_events_event_type_check
  check (event_type in ('seller_contact_outcome', 'seller_photos_submitted'));

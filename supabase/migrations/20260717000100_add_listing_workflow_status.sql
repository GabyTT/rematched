alter table public.normalized_listings
add column workflow_status text not null default 'imported';

alter table public.normalized_listings
add constraint normalized_listings_workflow_status_check check (
  workflow_status in (
    'imported',
    'verified',
    'seller_contacted',
    'assets_received',
    'live',
    'seller_declined',
    'no_response',
    'hidden',
    'retired'
  )
);

create index normalized_listings_workflow_status_idx
on public.normalized_listings (workflow_status);

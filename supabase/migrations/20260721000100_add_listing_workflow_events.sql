-- Keep an admin audit trail for seller follow-up without placing seller notes
-- in the buyer-visible listing record.

create table public.listing_workflow_events (
  id uuid primary key default gen_random_uuid(),
  normalized_listing_id uuid not null references public.normalized_listings(id) on delete cascade,
  event_type text not null,
  previous_workflow_status text,
  next_workflow_status text not null,
  contact_method text,
  seller_contact_outcome text,
  notes text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint listing_workflow_events_event_type_check check (
    event_type in ('seller_contact_outcome')
  ),
  constraint listing_workflow_events_contact_method_check check (
    contact_method is null or contact_method in ('call', 'whatsapp')
  ),
  constraint listing_workflow_events_seller_contact_outcome_check check (
    seller_contact_outcome is null or seller_contact_outcome in (
      'agreed_assets_pending',
      'assets_received',
      'no_response',
      'seller_declined',
      'sold_or_unavailable'
    )
  )
);

create index listing_workflow_events_listing_occurred_at_idx
on public.listing_workflow_events (normalized_listing_id, occurred_at desc);

alter table public.listing_workflow_events enable row level security;

create policy "Admins can manage listing workflow events"
on public.listing_workflow_events
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.auth_user_id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.auth_user_id = auth.uid()
      and profiles.role = 'admin'
  )
);

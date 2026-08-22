alter table public.listing_workflow_events
add column expected_assets_at timestamptz,
add column follow_up_at timestamptz,
add column follow_up_overridden boolean not null default false;

create index listing_workflow_events_follow_up_at_idx
on public.listing_workflow_events (follow_up_at)
where follow_up_at is not null;

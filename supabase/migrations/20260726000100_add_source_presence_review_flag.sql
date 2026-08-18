-- Record a source-absence warning without deleting or automatically hiding a listing.

alter table public.normalized_listings
  add column source_missing_at timestamptz,
  add column source_missing_run_id uuid references public.ingestion_runs(id) on delete set null;

create index normalized_listings_source_missing_at_idx
on public.normalized_listings (source_missing_at)
where source_missing_at is not null;

comment on column public.normalized_listings.source_missing_at is
  'When a later full re-import for the same source date did not return this source listing ID.';
comment on column public.normalized_listings.source_missing_run_id is
  'The full ingestion run that first detected the source absence.';

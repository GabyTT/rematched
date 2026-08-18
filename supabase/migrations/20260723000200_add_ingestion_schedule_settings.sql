-- Source-specific controls for deciding how a source is run.
-- A scheduler/worker is still required to execute automatic runs.
alter table public.listing_sources
  add column ingestion_mode text not null default 'manual',
  add column scheduled_run_time time without time zone not null default time '05:00';

alter table public.listing_sources
  add constraint listing_sources_ingestion_mode_check
  check (ingestion_mode in ('manual', 'automatic_daily'));

comment on column public.listing_sources.ingestion_mode is
  'Manual means an admin starts a run. automatic_daily records the intended daily schedule; a scheduler must execute it.';

comment on column public.listing_sources.scheduled_run_time is
  'Local daily time requested for automatic ingestion runs.';

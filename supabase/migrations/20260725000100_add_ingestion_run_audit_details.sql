-- Keep enough context on each manual ingestion run for the Admin Run History
-- to explain exactly what was selected and imported.

alter table public.ingestion_runs
  add column manual_import_type text,
  add column source_listing_date date,
  add column source_listings_found integer,
  add column source_listing_ids jsonb not null default '[]'::jsonb;

alter table public.ingestion_runs
  add constraint ingestion_runs_manual_import_type_check check (
    manual_import_type is null
    or manual_import_type in ('test', 'full')
  ),
  add constraint ingestion_runs_source_listings_found_check check (
    source_listings_found is null or source_listings_found >= 0
  ),
  add constraint ingestion_runs_source_listing_ids_array_check check (
    jsonb_typeof(source_listing_ids) = 'array'
  );

comment on column public.ingestion_runs.manual_import_type is
  'Whether the admin confirmed a test-five or full-date manual import.';
comment on column public.ingestion_runs.source_listing_date is
  'The TriniCars Date Added day selected by the admin before this run.';
comment on column public.ingestion_runs.source_listings_found is
  'How many source listings the read-only date check found before confirmation.';
comment on column public.ingestion_runs.source_listing_ids is
  'The exact source listing IDs selected for this run, in source order.';

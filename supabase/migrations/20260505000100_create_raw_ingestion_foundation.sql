-- Phase 2: listing source and raw ingestion foundation.
-- This migration intentionally does not create normalized listings or buyer-facing inventory tables.

create table public.listing_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text not null,
  base_url text,
  ingestion_enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint listing_sources_source_name_not_blank_check check (
    length(btrim(source_name)) > 0
  ),
  constraint listing_sources_source_type_check check (
    source_type in (
      'marketplace',
      'dealer_site',
      'dealer_feed',
      'native_revmatched'
    )
  )
);

create unique index listing_sources_source_name_unique_idx
on public.listing_sources (lower(btrim(source_name)));

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  listing_source_id uuid not null references public.listing_sources(id) on delete restrict,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  listings_fetched integer not null default 0,
  listings_normalized integer not null default 0,
  parser_errors integer not null default 0,
  duplicate_warnings integer not null default 0,
  run_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ingestion_runs_status_check check (
    status in ('running', 'completed', 'partial', 'failed')
  ),
  constraint ingestion_runs_finished_after_started_check check (
    finished_at is null or finished_at >= started_at
  ),
  constraint ingestion_runs_listings_fetched_check check (listings_fetched >= 0),
  constraint ingestion_runs_listings_normalized_check check (listings_normalized >= 0),
  constraint ingestion_runs_parser_errors_check check (parser_errors >= 0),
  constraint ingestion_runs_duplicate_warnings_check check (duplicate_warnings >= 0)
);

create index ingestion_runs_listing_source_id_idx
on public.ingestion_runs (listing_source_id);

create index ingestion_runs_status_idx
on public.ingestion_runs (status);

create table public.raw_listings (
  id uuid primary key default gen_random_uuid(),
  listing_source_id uuid not null references public.listing_sources(id) on delete restrict,
  ingestion_run_id uuid references public.ingestion_runs(id) on delete set null,
  source_listing_id text,
  source_listing_url text,
  raw_title text,
  raw_description text,
  raw_price_text text,
  raw_location_text text,
  raw_contact_text text,
  raw_seller_label text,
  raw_mileage_text text,
  raw_fuel_text text,
  raw_transmission_text text,
  raw_trim_text text,
  raw_payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint raw_listings_source_identity_check check (
    source_listing_id is not null or source_listing_url is not null
  )
);

create index raw_listings_listing_source_id_idx
on public.raw_listings (listing_source_id);

create index raw_listings_ingestion_run_id_idx
on public.raw_listings (ingestion_run_id);

create unique index raw_listings_source_listing_id_unique_idx
on public.raw_listings (listing_source_id, source_listing_id)
where source_listing_id is not null;

create table public.raw_listing_images (
  id uuid primary key default gen_random_uuid(),
  raw_listing_id uuid not null references public.raw_listings(id) on delete cascade,
  image_url text not null,
  display_order integer not null default 0,
  source_attribution_required boolean not null default true,
  preview_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint raw_listing_images_image_url_not_blank_check check (
    length(btrim(image_url)) > 0
  ),
  constraint raw_listing_images_display_order_check check (display_order >= 0)
);

create index raw_listing_images_raw_listing_id_idx
on public.raw_listing_images (raw_listing_id);

create trigger set_listing_sources_updated_at
before update on public.listing_sources
for each row
execute function public.set_updated_at();

create trigger set_ingestion_runs_updated_at
before update on public.ingestion_runs
for each row
execute function public.set_updated_at();

create trigger set_raw_listings_updated_at
before update on public.raw_listings
for each row
execute function public.set_updated_at();

create trigger set_raw_listing_images_updated_at
before update on public.raw_listing_images
for each row
execute function public.set_updated_at();

alter table public.listing_sources enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.raw_listings enable row level security;
alter table public.raw_listing_images enable row level security;

create policy "Admins can manage listing sources"
on public.listing_sources
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

create policy "Admins can manage ingestion runs"
on public.ingestion_runs
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

create policy "Admins can manage raw listings"
on public.raw_listings
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

create policy "Admins can manage raw listing images"
on public.raw_listing_images
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

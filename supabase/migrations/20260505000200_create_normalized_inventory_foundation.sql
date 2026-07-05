-- Phase 3: normalized buyer-facing inventory foundation.
-- This migration intentionally does not connect Discover or create buyer interaction tables.

create table public.normalized_listings (
  id uuid primary key default gen_random_uuid(),
  raw_listing_id uuid references public.raw_listings(id) on delete set null,
  listing_source_id uuid references public.listing_sources(id) on delete restrict,
  source_listing_id text,
  source_listing_url text,
  display_name text not null,
  title text,
  price_amount integer,
  year integer,
  brand_name text,
  model_name text,
  trim_name text,
  mileage_value integer,
  fuel_type text,
  transmission_type text,
  body_type text,
  location_label text,
  seller_type text,
  contact_method text,
  import_status text,
  availability_status text not null default 'unknown',
  review_status text not null default 'review_required',
  recommendation_state text not null default 'review_required',
  is_buyer_visible boolean not null default false,
  buyer_visibility_reason text,
  normalization_confidence numeric(4, 3),
  source_attribution_required boolean not null default true,
  source_images_allowed_for_preview boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint normalized_listings_display_name_not_blank_check check (
    length(btrim(display_name)) > 0
  ),
  constraint normalized_listings_price_amount_check check (
    price_amount is null or price_amount >= 0
  ),
  constraint normalized_listings_year_check check (
    year is null or year between 1900 and extract(year from now())::integer + 1
  ),
  constraint normalized_listings_mileage_value_check check (
    mileage_value is null or mileage_value >= 0
  ),
  constraint normalized_listings_normalization_confidence_check check (
    normalization_confidence is null
    or normalization_confidence between 0 and 1
  ),
  constraint normalized_listings_availability_status_check check (
    availability_status in ('available', 'unknown', 'unavailable', 'sold', 'stale')
  ),
  constraint normalized_listings_review_status_check check (
    review_status in ('approved', 'review_required', 'rejected', 'hidden')
  ),
  constraint normalized_listings_recommendation_state_check check (
    recommendation_state in ('eligible', 'limited', 'review_required', 'hidden')
  )
);

create index normalized_listings_raw_listing_id_idx
on public.normalized_listings (raw_listing_id);

create index normalized_listings_listing_source_id_idx
on public.normalized_listings (listing_source_id);

create index normalized_listings_buyer_visibility_idx
on public.normalized_listings (
  is_buyer_visible,
  review_status,
  recommendation_state,
  availability_status
);

create unique index normalized_listings_source_listing_id_unique_idx
on public.normalized_listings (listing_source_id, source_listing_id)
where listing_source_id is not null and source_listing_id is not null;

create table public.normalized_listing_images (
  id uuid primary key default gen_random_uuid(),
  normalized_listing_id uuid not null references public.normalized_listings(id) on delete cascade,
  raw_listing_image_id uuid references public.raw_listing_images(id) on delete set null,
  display_url text not null,
  display_order integer not null default 0,
  is_primary boolean not null default false,
  preview_allowed boolean not null default true,
  source_attribution_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint normalized_listing_images_display_url_not_blank_check check (
    length(btrim(display_url)) > 0
  ),
  constraint normalized_listing_images_display_order_check check (display_order >= 0)
);

create index normalized_listing_images_normalized_listing_id_idx
on public.normalized_listing_images (normalized_listing_id);

create index normalized_listing_images_raw_listing_image_id_idx
on public.normalized_listing_images (raw_listing_image_id);

create trigger set_normalized_listings_updated_at
before update on public.normalized_listings
for each row
execute function public.set_updated_at();

create trigger set_normalized_listing_images_updated_at
before update on public.normalized_listing_images
for each row
execute function public.set_updated_at();

alter table public.normalized_listings enable row level security;
alter table public.normalized_listing_images enable row level security;

create policy "Admins can manage normalized listings"
on public.normalized_listings
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

create policy "Buyers can read buyer-visible normalized listings"
on public.normalized_listings
for select
to authenticated
using (
  is_buyer_visible = true
  and review_status = 'approved'
  and recommendation_state in ('eligible', 'limited')
  and availability_status = 'available'
);

create policy "Admins can manage normalized listing images"
on public.normalized_listing_images
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

create policy "Buyers can read buyer-visible normalized listing images"
on public.normalized_listing_images
for select
to authenticated
using (
  preview_allowed = true
  and exists (
    select 1
    from public.normalized_listings
    where normalized_listings.id = normalized_listing_images.normalized_listing_id
      and normalized_listings.is_buyer_visible = true
      and normalized_listings.review_status = 'approved'
      and normalized_listings.recommendation_state in ('eligible', 'limited')
      and normalized_listings.availability_status = 'available'
  )
);

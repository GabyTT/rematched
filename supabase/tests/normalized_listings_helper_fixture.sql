begin;

delete from public.normalized_listings
where source_listing_id in (
  'normalized-helper-visible',
  'normalized-helper-hidden',
  'normalized-helper-review'
);

delete from public.listing_sources
where source_name = 'Normalized Helper Smoke Source';

with source as (
  insert into public.listing_sources (
    source_name,
    source_type,
    base_url
  )
  values (
    'Normalized Helper Smoke Source',
    'marketplace',
    'https://example.test/normalized-helper'
  )
  returning id
),
visible_listing as (
  insert into public.normalized_listings (
    listing_source_id,
    source_listing_id,
    source_listing_url,
    display_name,
    title,
    price_amount,
    year,
    brand_name,
    model_name,
    mileage_value,
    fuel_type,
    transmission_type,
    body_type,
    location_label,
    seller_type,
    contact_method,
    import_status,
    availability_status,
    review_status,
    recommendation_state,
    is_buyer_visible,
    buyer_visibility_reason,
    normalization_confidence,
    source_attribution_required,
    source_images_allowed_for_preview
  )
  select
    source.id,
    'normalized-helper-visible',
    'https://example.test/normalized-helper/visible',
    '2020 Toyota Corolla',
    'Toyota Corolla 2020',
    118000,
    2020,
    'Toyota',
    'Corolla',
    65000,
    'gasoline',
    'automatic',
    'sedan',
    'San Fernando',
    'private',
    'whatsapp',
    'local_used',
    'available',
    'approved',
    'eligible',
    true,
    'Smoke-test visible listing',
    0.95,
    true,
    true
  from source
  returning id
),
hidden_listing as (
  insert into public.normalized_listings (
    listing_source_id,
    source_listing_id,
    source_listing_url,
    display_name,
    title,
    price_amount,
    year,
    brand_name,
    model_name,
    availability_status,
    review_status,
    recommendation_state,
    is_buyer_visible,
    buyer_visibility_reason
  )
  select
    source.id,
    'normalized-helper-hidden',
    'https://example.test/normalized-helper/hidden',
    '2018 Honda Civic',
    'Honda Civic 2018',
    95000,
    2018,
    'Honda',
    'Civic',
    'available',
    'approved',
    'eligible',
    false,
    'Smoke-test hidden listing'
  from source
),
review_listing as (
  insert into public.normalized_listings (
    listing_source_id,
    source_listing_id,
    source_listing_url,
    display_name,
    title,
    price_amount,
    year,
    brand_name,
    model_name,
    availability_status,
    review_status,
    recommendation_state,
    is_buyer_visible,
    buyer_visibility_reason
  )
  select
    source.id,
    'normalized-helper-review',
    'https://example.test/normalized-helper/review',
    '2021 Mazda 3',
    'Mazda 3 2021',
    140000,
    2021,
    'Mazda',
    '3',
    'available',
    'review_required',
    'review_required',
    true,
    'Smoke-test review-blocked listing'
  from source
)
insert into public.normalized_listing_images (
  normalized_listing_id,
  display_url,
  display_order,
  is_primary,
  preview_allowed,
  source_attribution_required
)
select
  visible_listing.id,
  image.display_url,
  image.display_order,
  image.is_primary,
  true,
  true
from visible_listing
cross join (
  values
    ('https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=80', 0, true),
    ('https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1200&q=80', 1, false)
) as image(display_url, display_order, is_primary);

commit;

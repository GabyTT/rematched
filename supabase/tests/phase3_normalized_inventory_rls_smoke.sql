\set ON_ERROR_STOP on

-- Phase 3 smoke test for normalized buyer-facing inventory RLS.
-- Run against local Supabase only:
-- docker exec -i supabase_db_rev-matched psql -U postgres -d postgres < supabase/tests/phase3_normalized_inventory_rls_smoke.sql

begin;

delete from public.profiles
where auth_user_id in (
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666'
);

delete from auth.users
where id in (
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated',
    'authenticated',
    'phase3-admin@example.test',
    crypt('phase3-password', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-4666-8666-666666666666',
    'authenticated',
    'authenticated',
    'phase3-buyer@example.test',
    crypt('phase3-password', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.profiles (
  id,
  auth_user_id,
  display_name,
  role
)
values
  (
    '13131313-1313-4131-8131-131313131313',
    '55555555-5555-4555-8555-555555555555',
    'Phase 3 Admin',
    'admin'
  ),
  (
    '14141414-1414-4141-8141-141414141414',
    '66666666-6666-4666-8666-666666666666',
    'Phase 3 Buyer',
    'buyer'
  );

commit;

begin;

set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';

insert into public.listing_sources (
  id,
  source_name,
  source_type,
  base_url
)
values (
  '15151515-1515-4151-8151-151515151515',
  'Phase 3 Marketplace',
  'marketplace',
  'https://example.test/phase3'
);

insert into public.ingestion_runs (
  id,
  listing_source_id,
  finished_at,
  status,
  listings_fetched
)
values (
  '16161616-1616-4161-8161-161616161616',
  '15151515-1515-4151-8151-151515151515',
  now(),
  'completed',
  4
);

insert into public.raw_listings (
  id,
  listing_source_id,
  ingestion_run_id,
  source_listing_id,
  source_listing_url,
  raw_title,
  raw_price_text,
  raw_location_text
)
values
  (
    '17171717-1717-4171-8171-171717171717',
    '15151515-1515-4151-8151-151515151515',
    '16161616-1616-4161-8161-161616161616',
    'phase3-visible',
    'https://example.test/phase3/visible',
    '2020 Toyota Corolla',
    'TTD 120,000',
    'San Fernando'
  ),
  (
    '18181818-1818-4181-8181-181818181818',
    '15151515-1515-4151-8151-151515151515',
    '16161616-1616-4161-8161-161616161616',
    'phase3-hidden',
    'https://example.test/phase3/hidden',
    '2018 Honda Civic',
    'TTD 95,000',
    'Port of Spain'
  ),
  (
    '19191919-1919-4191-8191-191919191919',
    '15151515-1515-4151-8151-151515151515',
    '16161616-1616-4161-8161-161616161616',
    'phase3-rejected',
    'https://example.test/phase3/rejected',
    '2019 Nissan Note',
    'TTD 88,000',
    'Chaguanas'
  ),
  (
    '20202020-2020-4202-8202-202020202020',
    '15151515-1515-4151-8151-151515151515',
    '16161616-1616-4161-8161-161616161616',
    'phase3-review',
    'https://example.test/phase3/review',
    '2021 Mazda 3',
    'TTD 140,000',
    'Arima'
  );

insert into public.raw_listing_images (
  id,
  raw_listing_id,
  image_url,
  display_order,
  preview_allowed
)
values
  (
    '21212121-2121-4212-8212-212121212121',
    '17171717-1717-4171-8171-171717171717',
    'https://example.test/phase3/visible.jpg',
    0,
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '18181818-1818-4181-8181-181818181818',
    'https://example.test/phase3/hidden.jpg',
    0,
    true
  );

insert into public.normalized_listings (
  id,
  raw_listing_id,
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
values
  (
    '23232323-2323-4232-8232-232323232323',
    '17171717-1717-4171-8171-171717171717',
    '15151515-1515-4151-8151-151515151515',
    'phase3-visible',
    'https://example.test/phase3/visible',
    '2020 Toyota Corolla',
    'Toyota Corolla 2020',
    120000,
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
    'foreign_used',
    'available',
    'approved',
    'eligible',
    true,
    'Approved buyer-visible smoke-test listing',
    0.950,
    true,
    true
  ),
  (
    '24242424-2424-4242-8242-242424242424',
    '18181818-1818-4181-8181-181818181818',
    '15151515-1515-4151-8151-151515151515',
    'phase3-hidden',
    'https://example.test/phase3/hidden',
    '2018 Honda Civic',
    'Honda Civic 2018',
    95000,
    2018,
    'Honda',
    'Civic',
    82000,
    'gasoline',
    'automatic',
    'sedan',
    'Port of Spain',
    'private',
    'whatsapp',
    'local_used',
    'available',
    'approved',
    'eligible',
    false,
    'Admin-hidden smoke-test listing',
    0.920,
    true,
    true
  ),
  (
    '25252525-2525-4252-8252-252525252525',
    '19191919-1919-4191-8191-191919191919',
    '15151515-1515-4151-8151-151515151515',
    'phase3-rejected',
    'https://example.test/phase3/rejected',
    '2019 Nissan Note',
    'Nissan Note 2019',
    88000,
    2019,
    'Nissan',
    'Note',
    70000,
    'hybrid',
    'automatic',
    'hatchback',
    'Chaguanas',
    'dealer',
    'phone',
    'foreign_used',
    'available',
    'rejected',
    'hidden',
    true,
    'Rejected smoke-test listing',
    0.800,
    true,
    false
  ),
  (
    '26262626-2626-4262-8262-262626262626',
    '20202020-2020-4202-8202-202020202020',
    '15151515-1515-4151-8151-151515151515',
    'phase3-review',
    'https://example.test/phase3/review',
    '2021 Mazda 3',
    'Mazda 3 2021',
    140000,
    2021,
    'Mazda',
    '3',
    45000,
    'gasoline',
    'automatic',
    'hatchback',
    'Arima',
    'dealer',
    'phone',
    'local_used',
    'available',
    'review_required',
    'review_required',
    true,
    'Review-required smoke-test listing',
    0.700,
    true,
    false
  );

insert into public.normalized_listing_images (
  normalized_listing_id,
  raw_listing_image_id,
  display_url,
  display_order,
  is_primary,
  preview_allowed,
  source_attribution_required
)
values
  (
    '23232323-2323-4232-8232-232323232323',
    '21212121-2121-4212-8212-212121212121',
    'https://example.test/phase3/visible.jpg',
    0,
    true,
    true,
    true
  ),
  (
    '24242424-2424-4242-8242-242424242424',
    '22222222-2222-4222-8222-222222222222',
    'https://example.test/phase3/hidden.jpg',
    0,
    true,
    true,
    true
  );

do $$
declare
  listing_count integer;
  image_count integer;
  changed_rows integer;
begin
  select count(*) into listing_count
  from public.normalized_listings
  where listing_source_id = '15151515-1515-4151-8151-151515151515';

  if listing_count <> 4 then
    raise exception 'Admin should read exactly 4 normalized listings, got %', listing_count;
  end if;

  select count(*) into image_count
  from public.normalized_listing_images;

  if image_count <> 2 then
    raise exception 'Admin should read exactly 2 normalized listing images, got %', image_count;
  end if;

  update public.normalized_listings
  set price_amount = 118000
  where id = '23232323-2323-4232-8232-232323232323';

  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'Admin should update exactly 1 normalized listing, got %', changed_rows;
  end if;
end $$;

commit;

begin;

set local role authenticated;
set local request.jwt.claim.sub = '66666666-6666-4666-8666-666666666666';

do $$
declare
  visible_listing_count integer;
  visible_image_count integer;
  hidden_count integer;
  rejected_count integer;
  review_required_count integer;
  changed_rows integer;
begin
  select count(*) into visible_listing_count
  from public.normalized_listings;

  if visible_listing_count <> 1 then
    raise exception 'Buyer should read exactly 1 buyer-visible approved listing, got %', visible_listing_count;
  end if;

  select count(*) into visible_image_count
  from public.normalized_listing_images;

  if visible_image_count <> 1 then
    raise exception 'Buyer should read exactly 1 buyer-visible listing image, got %', visible_image_count;
  end if;

  select count(*) into hidden_count
  from public.normalized_listings
  where id = '24242424-2424-4242-8242-242424242424';

  if hidden_count <> 0 then
    raise exception 'Hidden listing should not be buyer-visible, got %', hidden_count;
  end if;

  select count(*) into rejected_count
  from public.normalized_listings
  where id = '25252525-2525-4252-8252-252525252525';

  if rejected_count <> 0 then
    raise exception 'Rejected listing should not be buyer-visible, got %', rejected_count;
  end if;

  select count(*) into review_required_count
  from public.normalized_listings
  where id = '26262626-2626-4262-8262-262626262626';

  if review_required_count <> 0 then
    raise exception 'Review-required listing should not be buyer-visible, got %', review_required_count;
  end if;

  update public.normalized_listings
  set price_amount = 1
  where id = '23232323-2323-4232-8232-232323232323';

  get diagnostics changed_rows = row_count;

  if changed_rows <> 0 then
    raise exception 'Buyer should update 0 normalized listings, got %', changed_rows;
  end if;

  begin
    insert into public.normalized_listings (
      display_name,
      availability_status,
      review_status,
      recommendation_state,
      is_buyer_visible
    )
    values (
      'Unauthorized buyer normalized listing',
      'available',
      'approved',
      'eligible',
      true
    );

    raise exception 'Buyer insert into normalized_listings should have failed';
  exception
    when insufficient_privilege then
      null;
  end;
end $$;

commit;

begin;

reset role;

do $$
declare
  preserved_price integer;
begin
  select price_amount into preserved_price
  from public.normalized_listings
  where id = '23232323-2323-4232-8232-232323232323';

  if preserved_price <> 118000 then
    raise exception 'Admin update should persist and buyer update should not, got %', preserved_price;
  end if;
end $$;

delete from public.raw_listings
where listing_source_id = '15151515-1515-4151-8151-151515151515';

delete from public.normalized_listings
where listing_source_id = '15151515-1515-4151-8151-151515151515';

delete from public.ingestion_runs
where id = '16161616-1616-4161-8161-161616161616';

delete from public.listing_sources
where id = '15151515-1515-4151-8151-151515151515';

delete from public.profiles
where auth_user_id in (
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666'
);

delete from auth.users
where id in (
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666'
);

commit;

select 'Phase 3 normalized inventory RLS smoke test passed' as result;

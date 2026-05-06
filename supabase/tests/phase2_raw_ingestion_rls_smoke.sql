\set ON_ERROR_STOP on

-- Phase 2 smoke test for raw ingestion/admin-only RLS.
-- Run against local Supabase only:
-- docker exec -i supabase_db_rev-matched psql -U postgres -d postgres < supabase/tests/phase2_raw_ingestion_rls_smoke.sql

begin;

delete from public.profiles
where auth_user_id in (
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444'
);

delete from auth.users
where id in (
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444'
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
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'phase2-admin@example.test',
    crypt('phase2-password', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'phase2-buyer@example.test',
    crypt('phase2-password', gen_salt('bf')),
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
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '33333333-3333-4333-8333-333333333333',
    'Phase 2 Admin',
    'admin'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '44444444-4444-4444-8444-444444444444',
    'Phase 2 Buyer',
    'buyer'
  );

commit;

begin;

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';

insert into public.listing_sources (
  id,
  source_name,
  source_type,
  base_url,
  notes
)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'Phase 2 Marketplace',
  'marketplace',
  'https://example.test/marketplace',
  'Smoke-test source'
);

insert into public.ingestion_runs (
  id,
  listing_source_id,
  finished_at,
  status,
  listings_fetched,
  listings_normalized,
  parser_errors,
  duplicate_warnings,
  run_notes
)
values (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  now(),
  'completed',
  1,
  0,
  0,
  0,
  'Smoke-test run'
);

insert into public.raw_listings (
  id,
  listing_source_id,
  ingestion_run_id,
  source_listing_id,
  source_listing_url,
  raw_title,
  raw_description,
  raw_price_text,
  raw_location_text,
  raw_contact_text,
  raw_seller_label,
  raw_mileage_text,
  raw_fuel_text,
  raw_transmission_text,
  raw_trim_text,
  raw_payload
)
values (
  '12121212-1212-4121-8121-121212121212',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'phase2-source-listing-1',
  'https://example.test/listings/1',
  '2019 Toyota Axio Hybrid',
  'Clean local listing text preserved from source.',
  'TTD 108,000',
  'Chaguanas',
  'WhatsApp 868-555-0000',
  'Private seller',
  '72,000 km',
  'Hybrid',
  'Automatic',
  'G trim',
  '{"source": "smoke-test"}'::jsonb
);

insert into public.raw_listing_images (
  raw_listing_id,
  image_url,
  display_order,
  source_attribution_required,
  preview_allowed
)
values
  (
    '12121212-1212-4121-8121-121212121212',
    'https://example.test/images/1.jpg',
    0,
    true,
    false
  ),
  (
    '12121212-1212-4121-8121-121212121212',
    'https://example.test/images/2.jpg',
    1,
    true,
    false
  );

do $$
declare
  source_count integer;
  run_count integer;
  raw_listing_count integer;
  image_count integer;
  changed_rows integer;
begin
  select count(*) into source_count
  from public.listing_sources
  where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

  if source_count <> 1 then
    raise exception 'Admin should read exactly 1 listing source, got %', source_count;
  end if;

  select count(*) into run_count
  from public.ingestion_runs
  where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

  if run_count <> 1 then
    raise exception 'Admin should read exactly 1 ingestion run, got %', run_count;
  end if;

  select count(*) into raw_listing_count
  from public.raw_listings
  where id = '12121212-1212-4121-8121-121212121212';

  if raw_listing_count <> 1 then
    raise exception 'Admin should read exactly 1 raw listing, got %', raw_listing_count;
  end if;

  select count(*) into image_count
  from public.raw_listing_images
  where raw_listing_id = '12121212-1212-4121-8121-121212121212';

  if image_count <> 2 then
    raise exception 'Admin should read exactly 2 raw listing images, got %', image_count;
  end if;

  update public.raw_listings
  set raw_price_text = 'TTD 105,000'
  where id = '12121212-1212-4121-8121-121212121212';

  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'Admin should update exactly 1 raw listing, got %', changed_rows;
  end if;
end $$;

commit;

begin;

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';

do $$
declare
  source_count integer;
  run_count integer;
  raw_listing_count integer;
  image_count integer;
  changed_rows integer;
begin
  select count(*) into source_count
  from public.listing_sources;

  if source_count <> 0 then
    raise exception 'Buyer should read 0 listing sources, got %', source_count;
  end if;

  select count(*) into run_count
  from public.ingestion_runs;

  if run_count <> 0 then
    raise exception 'Buyer should read 0 ingestion runs, got %', run_count;
  end if;

  select count(*) into raw_listing_count
  from public.raw_listings;

  if raw_listing_count <> 0 then
    raise exception 'Buyer should read 0 raw listings, got %', raw_listing_count;
  end if;

  select count(*) into image_count
  from public.raw_listing_images;

  if image_count <> 0 then
    raise exception 'Buyer should read 0 raw listing images, got %', image_count;
  end if;

  update public.raw_listings
  set raw_price_text = 'Unauthorized buyer edit'
  where id = '12121212-1212-4121-8121-121212121212';

  get diagnostics changed_rows = row_count;

  if changed_rows <> 0 then
    raise exception 'Buyer should update 0 raw listings, got %', changed_rows;
  end if;

  begin
    insert into public.listing_sources (
      source_name,
      source_type
    )
    values (
      'Unauthorized Buyer Source',
      'marketplace'
    );

    raise exception 'Buyer insert into listing_sources should have failed';
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
  preserved_price text;
begin
  select raw_price_text into preserved_price
  from public.raw_listings
  where id = '12121212-1212-4121-8121-121212121212';

  if preserved_price <> 'TTD 105,000' then
    raise exception 'Admin update should persist and buyer update should not, got %', preserved_price;
  end if;
end $$;

delete from public.raw_listings
where id = '12121212-1212-4121-8121-121212121212';

delete from public.ingestion_runs
where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

delete from public.listing_sources
where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

delete from public.profiles
where auth_user_id in (
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444'
);

delete from auth.users
where id in (
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444'
);

commit;

select 'Phase 2 raw ingestion RLS smoke test passed' as result;

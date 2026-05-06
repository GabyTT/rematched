\set ON_ERROR_STOP on

-- Phase 1 smoke test for buyer profile/preference RLS.
-- Run against local Supabase only:
-- docker exec -i supabase_db_rev-matched psql -U postgres -d postgres < supabase/tests/phase1_profile_preferences_rls_smoke.sql

begin;

delete from public.profiles
where auth_user_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

delete from auth.users
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
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
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'phase1-owner@example.test',
    crypt('phase1-password', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'phase1-other@example.test',
    crypt('phase1-password', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

commit;

begin;

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

insert into public.profiles (
  id,
  auth_user_id,
  display_name,
  phone,
  whatsapp_enabled
)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  'Phase 1 Owner',
  '+18685550101',
  true
);

insert into public.preference_profiles (
  id,
  profile_id,
  budget_min,
  budget_max,
  vehicle_type,
  model_query
)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  85000,
  145000,
  'suv',
  'RAV4'
);

insert into public.preference_profile_brands (
  preference_profile_id,
  brand_name
)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Toyota'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Honda'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Nissan');

do $$
declare
  visible_profiles integer;
  visible_preferences integer;
  visible_brands integer;
  changed_rows integer;
begin
  select count(*) into visible_profiles
  from public.profiles
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  if visible_profiles <> 1 then
    raise exception 'Owner should read exactly 1 profile, got %', visible_profiles;
  end if;

  select count(*) into visible_preferences
  from public.preference_profiles
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  if visible_preferences <> 1 then
    raise exception 'Owner should read exactly 1 preference profile, got %', visible_preferences;
  end if;

  select count(*) into visible_brands
  from public.preference_profile_brands
  where preference_profile_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  if visible_brands <> 3 then
    raise exception 'Owner should read exactly 3 preference brands, got %', visible_brands;
  end if;

  update public.profiles
  set display_name = 'Phase 1 Owner Updated'
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'Owner should update exactly 1 profile row, got %', changed_rows;
  end if;

  update public.preference_profiles
  set budget_max = 155000
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'Owner should update exactly 1 preference row, got %', changed_rows;
  end if;

  update public.preference_profile_brands
  set brand_name = 'Mazda'
  where preference_profile_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    and brand_name = 'Nissan';

  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'Owner should update exactly 1 brand row, got %', changed_rows;
  end if;
end $$;

commit;

begin;

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

do $$
declare
  visible_profiles integer;
  visible_preferences integer;
  visible_brands integer;
  changed_rows integer;
begin
  select count(*) into visible_profiles
  from public.profiles
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  if visible_profiles <> 0 then
    raise exception 'Other user should read 0 owner profiles, got %', visible_profiles;
  end if;

  select count(*) into visible_preferences
  from public.preference_profiles
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  if visible_preferences <> 0 then
    raise exception 'Other user should read 0 owner preference profiles, got %', visible_preferences;
  end if;

  select count(*) into visible_brands
  from public.preference_profile_brands
  where preference_profile_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  if visible_brands <> 0 then
    raise exception 'Other user should read 0 owner preference brands, got %', visible_brands;
  end if;

  update public.profiles
  set display_name = 'Unauthorized Profile Update'
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  get diagnostics changed_rows = row_count;

  if changed_rows <> 0 then
    raise exception 'Other user should update 0 owner profile rows, got %', changed_rows;
  end if;

  update public.preference_profiles
  set budget_max = 1
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  get diagnostics changed_rows = row_count;

  if changed_rows <> 0 then
    raise exception 'Other user should update 0 owner preference rows, got %', changed_rows;
  end if;

  update public.preference_profile_brands
  set brand_name = 'Unauthorized Brand'
  where preference_profile_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  get diagnostics changed_rows = row_count;

  if changed_rows <> 0 then
    raise exception 'Other user should update 0 owner brand rows, got %', changed_rows;
  end if;
end $$;

commit;

begin;

reset role;

do $$
declare
  owner_profile_name text;
  owner_budget_max integer;
  owner_brand_count integer;
  unauthorized_brand_count integer;
begin
  select display_name into owner_profile_name
  from public.profiles
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  if owner_profile_name <> 'Phase 1 Owner Updated' then
    raise exception 'Owner profile update was not preserved, got %', owner_profile_name;
  end if;

  select budget_max into owner_budget_max
  from public.preference_profiles
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  if owner_budget_max <> 155000 then
    raise exception 'Owner preference update was not preserved, got %', owner_budget_max;
  end if;

  select count(*) into owner_brand_count
  from public.preference_profile_brands
  where preference_profile_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    and brand_name in ('Toyota', 'Honda', 'Mazda');

  if owner_brand_count <> 3 then
    raise exception 'Owner brand updates were not preserved, got % expected brands', owner_brand_count;
  end if;

  select count(*) into unauthorized_brand_count
  from public.preference_profile_brands
  where brand_name = 'Unauthorized Brand';

  if unauthorized_brand_count <> 0 then
    raise exception 'Unauthorized brand update should not persist, got % rows', unauthorized_brand_count;
  end if;
end $$;

rollback;

begin;

delete from public.profiles
where auth_user_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

delete from auth.users
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

commit;

select 'Phase 1 profile/preference RLS smoke test passed' as result;

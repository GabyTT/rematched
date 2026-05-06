-- Phase 1: buyer profile and preference foundation.
-- This migration intentionally does not create listing ingestion or inventory tables.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  whatsapp_enabled boolean not null default false,
  role text not null default 'buyer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_auth_user_id_key unique (auth_user_id),
  constraint profiles_role_check check (role in ('buyer', 'seller', 'admin'))
);

create table public.preference_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  is_active boolean not null default true,
  budget_min integer,
  budget_max integer,
  vehicle_type text,
  model_query text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint preference_profiles_budget_min_check check (
    budget_min is null or budget_min >= 0
  ),
  constraint preference_profiles_budget_max_check check (
    budget_max is null or budget_max >= 0
  ),
  constraint preference_profiles_budget_range_check check (
    budget_min is null
    or budget_max is null
    or budget_min <= budget_max
  )
);

create unique index preference_profiles_one_active_per_profile_idx
on public.preference_profiles (profile_id)
where is_active;

create table public.preference_profile_brands (
  id uuid primary key default gen_random_uuid(),
  preference_profile_id uuid not null references public.preference_profiles(id) on delete cascade,
  brand_name text not null,
  brand_name_normalized text generated always as (lower(btrim(brand_name))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint preference_profile_brands_brand_name_not_blank_check check (
    length(btrim(brand_name)) > 0
  ),
  constraint preference_profile_brands_brand_name_unique unique (
    preference_profile_id,
    brand_name_normalized
  )
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_preference_profiles_updated_at
before update on public.preference_profiles
for each row
execute function public.set_updated_at();

create trigger set_preference_profile_brands_updated_at
before update on public.preference_profile_brands
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.preference_profiles enable row level security;
alter table public.preference_profile_brands enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth_user_id = auth.uid());

create policy "Users can create their own buyer profile"
on public.profiles
for insert
to authenticated
with check (
  auth_user_id = auth.uid()
  and role = 'buyer'
);

create policy "Users can update their own buyer profile"
on public.profiles
for update
to authenticated
using (auth_user_id = auth.uid())
with check (
  auth_user_id = auth.uid()
  and role = 'buyer'
);

create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using (auth_user_id = auth.uid());

create policy "Users can read their own preference profiles"
on public.preference_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = preference_profiles.profile_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "Users can create their own preference profiles"
on public.preference_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = preference_profiles.profile_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "Users can update their own preference profiles"
on public.preference_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = preference_profiles.profile_id
      and profiles.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = preference_profiles.profile_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "Users can delete their own preference profiles"
on public.preference_profiles
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = preference_profiles.profile_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "Users can read their own preference brands"
on public.preference_profile_brands
for select
to authenticated
using (
  exists (
    select 1
    from public.preference_profiles
    join public.profiles
      on profiles.id = preference_profiles.profile_id
    where preference_profiles.id = preference_profile_brands.preference_profile_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "Users can create their own preference brands"
on public.preference_profile_brands
for insert
to authenticated
with check (
  exists (
    select 1
    from public.preference_profiles
    join public.profiles
      on profiles.id = preference_profiles.profile_id
    where preference_profiles.id = preference_profile_brands.preference_profile_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "Users can update their own preference brands"
on public.preference_profile_brands
for update
to authenticated
using (
  exists (
    select 1
    from public.preference_profiles
    join public.profiles
      on profiles.id = preference_profiles.profile_id
    where preference_profiles.id = preference_profile_brands.preference_profile_id
      and profiles.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.preference_profiles
    join public.profiles
      on profiles.id = preference_profiles.profile_id
    where preference_profiles.id = preference_profile_brands.preference_profile_id
      and profiles.auth_user_id = auth.uid()
  )
);

create policy "Users can delete their own preference brands"
on public.preference_profile_brands
for delete
to authenticated
using (
  exists (
    select 1
    from public.preference_profiles
    join public.profiles
      on profiles.id = preference_profiles.profile_id
    where preference_profiles.id = preference_profile_brands.preference_profile_id
      and profiles.auth_user_id = auth.uid()
  )
);

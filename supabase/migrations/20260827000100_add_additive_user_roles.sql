-- Buyer access is the baseline for every Supabase Auth user. Elevated roles are
-- additive and are assigned only through privileged database access.

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),

  primary key (user_id, role),
  constraint user_roles_role_check check (role in ('seller', 'advertiser', 'admin'))
);

alter table public.user_roles enable row level security;

create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

-- No client write policy is intentionally provided. Use the SQL below (or a
-- service-role-only admin workflow) to grant elevated capabilities.

create or replace function public.has_role(required_role text, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = target_user_id
      and role = required_role
  );
$$;

revoke all on function public.has_role(text, uuid) from public;
grant execute on function public.has_role(text, uuid) to authenticated;

-- Preserve only explicitly elevated legacy assignments; buyer was never an
-- elevated role and is deliberately not copied.
insert into public.user_roles (user_id, role)
select auth_user_id, role
from public.profiles
where role in ('seller', 'admin')
on conflict do nothing;

-- Replace every legacy admin RLS policy before removing profiles.role, so role
-- checks have one database-controlled source of truth.
drop policy if exists "Admins can manage listing sources" on public.listing_sources;
drop policy if exists "Admins can manage ingestion runs" on public.ingestion_runs;
drop policy if exists "Admins can manage raw listings" on public.raw_listings;
drop policy if exists "Admins can manage raw listing images" on public.raw_listing_images;
drop policy if exists "Admins can manage normalized listings" on public.normalized_listings;
drop policy if exists "Admins can manage normalized listing images" on public.normalized_listing_images;
drop policy if exists "Admins can manage listing workflow events" on public.listing_workflow_events;
drop policy if exists "Admins can manage seller accounts" on public.seller_accounts;
drop policy if exists "Admins can manage seller listing assignments" on public.seller_listing_assignments;
drop policy if exists "Admins can manage seller access codes" on public.seller_access_codes;
drop policy if exists "Admins can manage seller listing submissions" on public.seller_listing_submissions;
drop policy if exists "Admins can manage seller listing media assets" on public.seller_listing_media_assets;

create policy "Admins can manage listing sources" on public.listing_sources for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage ingestion runs" on public.ingestion_runs for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage raw listings" on public.raw_listings for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage raw listing images" on public.raw_listing_images for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage normalized listings" on public.normalized_listings for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage normalized listing images" on public.normalized_listing_images for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage listing workflow events" on public.listing_workflow_events for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage seller accounts" on public.seller_accounts for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage seller listing assignments" on public.seller_listing_assignments for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage seller access codes" on public.seller_access_codes for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage seller listing submissions" on public.seller_listing_submissions for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "Admins can manage seller listing media assets" on public.seller_listing_media_assets for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

alter table public.profiles drop constraint if exists profiles_role_check;

-- These original buyer-profile policies required role = 'buyer'. Buyer access
-- is now implicit, so retain ownership checks without the legacy role column.
drop policy if exists "Users can create their own buyer profile" on public.profiles;
drop policy if exists "Users can update their own buyer profile" on public.profiles;

create policy "Users can create their own buyer profile"
on public.profiles
for insert
to authenticated
with check (auth_user_id = auth.uid());

create policy "Users can update their own buyer profile"
on public.profiles
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

alter table public.profiles drop column if exists role;

-- Manual grant example (run in the Supabase SQL editor as a database owner):
-- insert into public.user_roles (user_id, role)
-- values ('<auth.users.id>', 'admin')
-- on conflict do nothing;

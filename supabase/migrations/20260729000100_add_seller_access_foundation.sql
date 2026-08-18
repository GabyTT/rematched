-- Admin-managed seller access. Seller authentication and the seller portal are
-- built separately; this migration only stores the account, linked listings,
-- and a single replaceable access-code digest.

create table public.seller_accounts (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint seller_accounts_phone_e164_check check (
    phone_e164 ~ '^\\+[1-9][0-9]{7,14}$'
  )
);

create table public.seller_listing_assignments (
  id uuid primary key default gen_random_uuid(),
  seller_account_id uuid not null references public.seller_accounts(id) on delete cascade,
  normalized_listing_id uuid not null references public.normalized_listings(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint seller_listing_assignments_listing_unique unique (normalized_listing_id)
);

create index seller_listing_assignments_seller_account_idx
on public.seller_listing_assignments (seller_account_id);

create table public.seller_access_codes (
  id uuid primary key default gen_random_uuid(),
  seller_account_id uuid not null unique references public.seller_accounts(id) on delete cascade,
  code_hash text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint seller_access_codes_expiry_check check (expires_at > issued_at)
);

create index seller_access_codes_expiry_idx
on public.seller_access_codes (expires_at);

create trigger seller_accounts_set_updated_at
before update on public.seller_accounts
for each row execute procedure public.set_updated_at();

create trigger seller_access_codes_set_updated_at
before update on public.seller_access_codes
for each row execute procedure public.set_updated_at();

alter table public.seller_accounts enable row level security;
alter table public.seller_listing_assignments enable row level security;
alter table public.seller_access_codes enable row level security;

create policy "Admins can manage seller accounts"
on public.seller_accounts
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.auth_user_id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.auth_user_id = auth.uid() and profiles.role = 'admin'
  )
);

create policy "Admins can manage seller listing assignments"
on public.seller_listing_assignments
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.auth_user_id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.auth_user_id = auth.uid() and profiles.role = 'admin'
  )
);

create policy "Admins can manage seller access codes"
on public.seller_access_codes
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.auth_user_id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.auth_user_id = auth.uid() and profiles.role = 'admin'
  )
);

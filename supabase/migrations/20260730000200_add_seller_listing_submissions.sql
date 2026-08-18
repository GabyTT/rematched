-- Seller-owned vehicle details are kept separately from imported source data.
-- The submitted core fields are also copied into normalized_listings by the
-- authenticated server route so approved/live buyer views can use them.

create table public.seller_listing_submissions (
  id uuid primary key default gen_random_uuid(),
  seller_account_id uuid not null references public.seller_accounts(id) on delete cascade,
  normalized_listing_id uuid not null references public.normalized_listings(id) on delete cascade,
  status text not null default 'draft',
  display_name text not null,
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
  colour text,
  engine_size text,
  features jsonb not null default '[]'::jsonb,
  additional_info text,
  public_contact_name text,
  public_contact_phone text,
  confirmation_accepted_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint seller_listing_submissions_listing_unique unique (normalized_listing_id),
  constraint seller_listing_submissions_status_check check (status in ('draft', 'submitted')),
  constraint seller_listing_submissions_display_name_not_blank_check check (length(btrim(display_name)) > 0),
  constraint seller_listing_submissions_price_amount_check check (price_amount is null or price_amount >= 0),
  constraint seller_listing_submissions_year_check check (
    year is null or year between 1900 and extract(year from now())::integer + 1
  ),
  constraint seller_listing_submissions_mileage_value_check check (mileage_value is null or mileage_value >= 0)
);

create index seller_listing_submissions_seller_account_idx
on public.seller_listing_submissions (seller_account_id);

create trigger seller_listing_submissions_set_updated_at
before update on public.seller_listing_submissions
for each row execute procedure public.set_updated_at();

alter table public.seller_listing_submissions enable row level security;

create policy "Admins can manage seller listing submissions"
on public.seller_listing_submissions
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

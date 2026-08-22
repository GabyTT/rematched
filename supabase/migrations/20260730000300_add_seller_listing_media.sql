-- Seller-provided photos are isolated from imported source media. They remain
-- private until an Admin explicitly approves them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'seller-listing-media',
  'seller-listing-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.seller_listing_media_assets (
  id uuid primary key default gen_random_uuid(),
  seller_account_id uuid not null references public.seller_accounts(id) on delete cascade,
  normalized_listing_id uuid not null references public.normalized_listings(id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  content_type text not null,
  file_size_bytes integer not null,
  requested_action text not null default 'add',
  approval_status text not null default 'pending',
  is_preferred_main boolean not null default false,
  review_note text,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint seller_listing_media_assets_requested_action_check
    check (requested_action in ('add', 'replace', 'remove')),
  constraint seller_listing_media_assets_approval_status_check
    check (approval_status in ('pending', 'approved', 'rejected')),
  constraint seller_listing_media_assets_file_size_check
    check (file_size_bytes > 0 and file_size_bytes <= 10485760)
);

create index seller_listing_media_assets_listing_status_idx
on public.seller_listing_media_assets (normalized_listing_id, approval_status, uploaded_at desc);

create index seller_listing_media_assets_seller_idx
on public.seller_listing_media_assets (seller_account_id, uploaded_at desc);

create trigger seller_listing_media_assets_set_updated_at
before update on public.seller_listing_media_assets
for each row execute procedure public.set_updated_at();

alter table public.seller_listing_media_assets enable row level security;

create policy "Admins can manage seller listing media assets"
on public.seller_listing_media_assets
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

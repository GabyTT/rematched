alter table public.raw_listings
add column source_posted_at timestamptz,
add column source_posted_text text,
add column source_refreshed_at timestamptz,
add column source_refreshed_text text;

create index raw_listings_source_posted_at_idx
on public.raw_listings (source_posted_at);

create index raw_listings_source_refreshed_at_idx
on public.raw_listings (source_refreshed_at);

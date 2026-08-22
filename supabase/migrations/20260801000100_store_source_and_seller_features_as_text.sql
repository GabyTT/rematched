-- Features are stored as plain text throughout the workflow. The seller UI may
-- still use checkboxes, but it serializes the selected labels into this text
-- field so imported and seller-confirmed information share the same shape.

alter table public.raw_listings
add column if not exists raw_features_text text;

update public.raw_listings
set raw_features_text = case
  when jsonb_typeof(raw_payload -> 'features') = 'array' then array_to_string(
    array(select jsonb_array_elements_text(raw_payload -> 'features')),
    ', '
  )
  when jsonb_typeof(raw_payload -> 'features') = 'string' then raw_payload ->> 'features'
  else null
end
where raw_features_text is null;

alter table public.seller_listing_submissions
add column if not exists features_text text;

update public.seller_listing_submissions
set features_text = case
  when jsonb_typeof(features) = 'array' then array_to_string(
    array(select jsonb_array_elements_text(features)),
    ', '
  )
  when jsonb_typeof(features) = 'string' then features #>> '{}'
  else ''
end
where features_text is null;

alter table public.seller_listing_submissions
drop column if exists features;

alter table public.seller_listing_submissions
rename column features_text to features;

alter table public.seller_listing_submissions
alter column features set default '',
alter column features set not null;

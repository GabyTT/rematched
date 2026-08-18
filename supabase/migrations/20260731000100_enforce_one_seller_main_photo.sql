-- A listing can have one actual buyer-facing main photo. Keep the newest
-- current selection when repairing any historic duplicate selections.

with ranked_main_photos as (
  select
    id,
    row_number() over (
      partition by normalized_listing_id
      order by updated_at desc, uploaded_at desc, id desc
    ) as selection_rank
  from public.seller_listing_media_assets
  where is_preferred_main = true
)
update public.seller_listing_media_assets as media
set is_preferred_main = false
from ranked_main_photos
where media.id = ranked_main_photos.id
  and ranked_main_photos.selection_rank > 1;

create unique index seller_listing_media_assets_one_preferred_main_idx
on public.seller_listing_media_assets (normalized_listing_id)
where is_preferred_main = true;

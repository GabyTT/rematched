import type { SupabaseClient } from "@supabase/supabase-js";

import type { Car } from "./cars.ts";
import type { Database } from "./database.types.ts";
import { mapNormalizedListingsToCars } from "./normalizedListingCarAdapter.ts";
import { readBuyerVisibleNormalizedListings } from "./normalizedListings.ts";

type TypedSupabaseClient = SupabaseClient<Database>;

const SELLER_MEDIA_BUCKET = "seller-listing-media";

async function readApprovedSellerListingImages(
  supabase: TypedSupabaseClient,
  listingIds: string[],
) {
  if (listingIds.length === 0) {
    return [];
  }

  const { data: mediaAssets, error: mediaError } = await supabase
    .from("seller_listing_media_assets")
    .select(
      "normalized_listing_id, storage_path, is_preferred_main, uploaded_at",
    )
    .in("normalized_listing_id", listingIds)
    .eq("approval_status", "approved")
    .in("requested_action", ["add", "replace"])
    .order("is_preferred_main", { ascending: false })
    .order("uploaded_at", { ascending: true });

  if (mediaError) {
    throw mediaError;
  }

  if (!mediaAssets.length) {
    return [];
  }

  const { data: signedUrls, error: signedUrlsError } = await supabase.storage
    .from(SELLER_MEDIA_BUCKET)
    .createSignedUrls(
      mediaAssets.map((asset) => asset.storage_path),
      60 * 60,
    );

  if (signedUrlsError) {
    throw signedUrlsError;
  }

  const displayOrderByListing = new Map<string, number>();

  return mediaAssets.flatMap((asset, index) => {
    const signedUrl = signedUrls[index]?.signedUrl;

    if (!signedUrl) {
      return [];
    }

    const displayOrder = displayOrderByListing.get(asset.normalized_listing_id) ?? 0;
    displayOrderByListing.set(asset.normalized_listing_id, displayOrder + 1);

    return [{
      normalized_listing_id: asset.normalized_listing_id,
      display_url: signedUrl,
      preview_allowed: true,
      is_primary: asset.is_preferred_main,
      display_order: displayOrder,
    }];
  });
}

export async function readBuyerVisibleInventoryCars(
  supabase: TypedSupabaseClient,
): Promise<Car[]> {
  const listings = await readBuyerVisibleNormalizedListings(supabase);
  const listingIds = listings.map((listing) => listing.id);
  const images = await readApprovedSellerListingImages(supabase, listingIds);

  return mapNormalizedListingsToCars(listings, images);
}

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Car } from "@/lib/cars";
import type { Database } from "@/lib/database.types";
import { mapNormalizedListingsToCars } from "@/lib/normalizedListingCarAdapter";
import {
  readBuyerVisibleNormalizedListingImages,
  readBuyerVisibleNormalizedListings,
} from "@/lib/normalizedListings";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function readBuyerVisibleInventoryCars(
  supabase: TypedSupabaseClient,
): Promise<Car[]> {
  const listings = await readBuyerVisibleNormalizedListings(supabase);
  const listingIds = listings.map((listing) => listing.id);
  const images = await readBuyerVisibleNormalizedListingImages(
    supabase,
    listingIds,
  );

  return mapNormalizedListingsToCars(listings, images);
}

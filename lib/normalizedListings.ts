import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

export type BuyerVisibleNormalizedListing = Tables<"normalized_listings">;
export type BuyerVisibleNormalizedListingImage =
  Tables<"normalized_listing_images">;

export async function readBuyerVisibleNormalizedListings(
  supabase: TypedSupabaseClient,
) {
  const { data, error } = await supabase
    .from("normalized_listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function readBuyerVisibleNormalizedListingImages(
  supabase: TypedSupabaseClient,
  normalizedListingIds: string[],
) {
  if (normalizedListingIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("normalized_listing_images")
    .select("*")
    .in("normalized_listing_id", normalizedListingIds)
    .order("display_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

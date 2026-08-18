import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "./database.types.ts";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * The intentionally limited shape used by buyer-facing screens. Source-site
 * details are excluded at the database view and must never be added here.
 */
export type BuyerVisibleNormalizedListing = Tables<"buyer_visible_listings">;
export async function readBuyerVisibleNormalizedListings(
  supabase: TypedSupabaseClient,
) {
  const { data, error } = await supabase
    .from("buyer_visible_listings")
    .select("*")
    .order("display_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

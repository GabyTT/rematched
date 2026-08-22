import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types.ts";
import { persistRawIngestion } from "../lib/ingestion/persistRawIngestion.ts";
import { createTriniCarsForSaleBackfillAdapter } from "../lib/ingestion/triniCarsForSaleAdapter.ts";
import { normalizeSourceInventory } from "../lib/normalization/normalizeSourceInventory.ts";
import { getLocalServiceRoleKey, loadLocalSupabaseEnv } from "./loadLocalSupabaseEnv.ts";

async function main() {
  loadLocalSupabaseEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getLocalServiceRoleKey();

  if (!supabaseUrl || !key) {
    throw new Error(
      "Backfill requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabase = createClient<Database>(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const { data: source, error: sourceError } = await supabase
    .from("listing_sources")
    .select("id")
    .eq("source_name", "TriniCarsForSale")
    .single();

  if (sourceError) throw sourceError;

  const { data: rawListings, error: rawListingsError } = await supabase
    .from("raw_listings")
    .select(
      "id, source_listing_id, raw_contact_text, raw_seller_label, source_posted_at, source_posted_text, raw_listing_images(id)",
    )
    .eq("listing_source_id", source.id)
    .order("created_at", { ascending: true });

  if (rawListingsError) throw rawListingsError;

  const sourceListingIds = rawListings
    .filter(
      (listing) =>
        listing.source_listing_id &&
        (!listing.raw_contact_text ||
          !listing.raw_seller_label ||
          !listing.source_posted_at ||
          listing.raw_listing_images.length === 0),
    )
    .map((listing) => listing.source_listing_id as string);

  if (sourceListingIds.length === 0) {
    console.log("No incomplete TriniCars raw listings were found.");
    return;
  }

  console.log(`Backfilling ${sourceListingIds.length} incomplete TriniCars listings.`);
  console.table(sourceListingIds.map((sourceListingId) => ({ source_listing_id: sourceListingId })));

  const adapter = createTriniCarsForSaleBackfillAdapter({ sourceListingIds });
  const ingestionResult = await persistRawIngestion(supabase, adapter);
  const normalizationResult = await normalizeSourceInventory(supabase, "TriniCarsForSale");

  console.log("Backfill ingestion completed.", ingestionResult);
  console.log(
    `Normalized ${normalizationResult.normalized} of ${normalizationResult.rawCount} TriniCars raw listings.`,
  );
  console.table(normalizationResult.results);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

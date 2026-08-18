import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../database.types.ts";
import { normalizeRawListing } from "./normalizeRawListing.ts";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function normalizeSourceInventory(
  supabase: TypedSupabaseClient,
  sourceName: string,
) {
  const { data: source, error: sourceError } = await supabase
    .from("listing_sources")
    .select("*")
    .eq("source_name", sourceName)
    .single();

  if (sourceError) throw sourceError;

  const { data: rawListings, error: rawListingsError } = await supabase
    .from("raw_listings")
    .select("*")
    .eq("listing_source_id", source.id)
    .order("created_at", { ascending: true });

  if (rawListingsError) throw rawListingsError;

  let normalized = 0;
  let errors = 0;
  const results: Array<{
    sourceListingId: string | null;
    displayName: string;
    reviewStatus: string;
    buyerVisible: boolean;
    confidence: number | null;
  }> = [];

  for (const rawListing of rawListings) {
    try {
      const { data: rawImages, error: rawImagesError } = await supabase
        .from("raw_listing_images")
        .select("*")
        .eq("raw_listing_id", rawListing.id)
        .order("display_order", { ascending: true });

      if (rawImagesError) throw rawImagesError;

      const values = normalizeRawListing(rawListing, rawImages);
      const { data: existing, error: existingError } = await supabase
        .from("normalized_listings")
        .select("id")
        .eq("listing_source_id", source.id)
        .eq("source_listing_id", rawListing.source_listing_id ?? "")
        .maybeSingle();

      if (existingError) throw existingError;

      const query = existing
        ? supabase.from("normalized_listings").update(values).eq("id", existing.id)
        : supabase.from("normalized_listings").insert(values);
      const { data: normalizedListing, error: normalizedListingError } = await query
        .select()
        .single();

      if (normalizedListingError) throw normalizedListingError;

      const { error: deleteImagesError } = await supabase
        .from("normalized_listing_images")
        .delete()
        .eq("normalized_listing_id", normalizedListing.id);

      if (deleteImagesError) throw deleteImagesError;

      if (rawImages.length > 0) {
        const { error: insertImagesError } = await supabase
          .from("normalized_listing_images")
          .insert(
            rawImages.map((image, index) => ({
              normalized_listing_id: normalizedListing.id,
              raw_listing_image_id: image.id,
              display_url: image.image_url,
              display_order: index,
              is_primary: index === 0,
              preview_allowed: image.preview_allowed,
              source_attribution_required: image.source_attribution_required,
            })),
          );

        if (insertImagesError) throw insertImagesError;
      }

      normalized += 1;
      results.push({
        sourceListingId: normalizedListing.source_listing_id,
        displayName: normalizedListing.display_name,
        reviewStatus: normalizedListing.review_status,
        buyerVisible: normalizedListing.is_buyer_visible,
        confidence: normalizedListing.normalization_confidence,
      });
    } catch (error) {
      errors += 1;
      console.error(`Failed to normalize raw listing ${rawListing.id}:`, error);
    }
  }

  const runIds = [...new Set(rawListings.map((listing) => listing.ingestion_run_id))].filter(
    (id): id is string => Boolean(id),
  );

  if (runIds.length > 0) {
    const { error: runUpdateError } = await supabase
      .from("ingestion_runs")
      .update({ listings_normalized: normalized })
      .in("id", runIds);

    if (runUpdateError) throw runUpdateError;
  }

  return { source, rawCount: rawListings.length, normalized, errors, results };
}

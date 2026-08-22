import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "../database.types.ts";
import { fetchValidatedListings, type ListingSourceAdapter } from "./sourceAdapter.ts";

type TypedSupabaseClient = SupabaseClient<Database>;

export type IngestionRunAuditDetails = {
  manualImportType: "test" | "full";
  sourceListingDate: string;
  sourceListingsFound: number;
  sourceListingIds: string[];
};

async function getOrCreateSource(
  supabase: TypedSupabaseClient,
  adapter: ListingSourceAdapter,
) {
  const { data: existing, error: selectError } = await supabase
    .from("listing_sources")
    .select("*")
    .eq("source_name", adapter.source.name)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("listing_sources")
      .update({
        source_type: adapter.source.type,
        base_url: adapter.source.baseUrl,
        notes: adapter.source.notes,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  const { data, error } = await supabase
    .from("listing_sources")
    .insert({
      source_name: adapter.source.name,
      source_type: adapter.source.type,
      base_url: adapter.source.baseUrl,
      notes: adapter.source.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function persistRawIngestion(
  supabase: TypedSupabaseClient,
  adapter: ListingSourceAdapter,
  auditDetails?: IngestionRunAuditDetails,
) {
  const listings = await fetchValidatedListings(adapter);
  const source = await getOrCreateSource(supabase, adapter);
  const { data: run, error: runError } = await supabase
    .from("ingestion_runs")
    .insert({
      listing_source_id: source.id,
      status: "running",
      listings_fetched: listings.length,
      manual_import_type: auditDetails?.manualImportType ?? null,
      source_listing_date: auditDetails?.sourceListingDate ?? null,
      source_listings_found: auditDetails?.sourceListingsFound ?? null,
      source_listing_ids: auditDetails?.sourceListingIds ?? [],
      run_notes: `Controlled adapter ingestion for ${adapter.source.name}.`,
    })
    .select()
    .single();

  if (runError) throw runError;

  let stored = 0;
  let parserErrors = 0;

  for (const listing of listings) {
    try {
      const { data: existingRawListing, error: existingRawListingError } = await supabase
        .from("raw_listings")
        .select("id")
        .eq("listing_source_id", source.id)
        .eq("source_listing_id", listing.sourceListingId)
        .maybeSingle();

      if (existingRawListingError) throw existingRawListingError;

      const rawValues = {
        listing_source_id: source.id,
        ingestion_run_id: run.id,
        source_listing_id: listing.sourceListingId,
        source_listing_url: listing.sourceListingUrl,
        raw_title: listing.title,
        raw_description: listing.description,
        raw_price_text: listing.priceText,
        raw_location_text: listing.locationText,
        raw_contact_text: listing.contactText,
        raw_seller_label: listing.sellerLabel,
        raw_mileage_text: listing.mileageText,
        raw_fuel_text: listing.fuelText,
        raw_transmission_text: listing.transmissionText,
        raw_trim_text: listing.trimText,
        raw_features_text: listing.featuresText ?? null,
        raw_colour_text: listing.colourText ?? null,
        raw_engine_size_text: listing.engineSizeText ?? null,
        raw_plate_series_text: listing.plateSeriesText ?? null,
        raw_is_negotiable: listing.isNegotiable ?? false,
        raw_payload: listing.rawPayload as Json,
        fetched_at: listing.fetchedAt ?? new Date().toISOString(),
        source_posted_at: listing.sourcePostedAt ?? null,
        source_posted_text: listing.sourcePostedText ?? null,
        source_refreshed_at: listing.sourceRefreshedAt ?? null,
        source_refreshed_text: listing.sourceRefreshedText ?? null,
      };
      const rawListingQuery = existingRawListing
        ? supabase
            .from("raw_listings")
            .update(rawValues)
            .eq("id", existingRawListing.id)
        : supabase.from("raw_listings").insert(rawValues);
      const { data: rawListing, error: rawListingError } = await rawListingQuery
        .select()
        .single();

      if (rawListingError) throw rawListingError;

      const { error: deleteImagesError } = await supabase
        .from("raw_listing_images")
        .delete()
        .eq("raw_listing_id", rawListing.id);

      if (deleteImagesError) throw deleteImagesError;

      if (listing.images?.length) {
        const { error: imageError } = await supabase.from("raw_listing_images").insert(
          listing.images.map((image, index) => ({
            raw_listing_id: rawListing.id,
            image_url: image.url,
            display_order: index,
            source_attribution_required: true,
            preview_allowed: image.previewAllowed ?? false,
          })),
        );

        if (imageError) throw imageError;
      }

      stored += 1;
    } catch (error) {
      parserErrors += 1;
      console.error(`Failed to store ${listing.sourceListingId}:`, error);
    }
  }

  const status = parserErrors === 0 ? "completed" : stored === 0 ? "failed" : "partial";
  const { data: completedRun, error: completionError } = await supabase
    .from("ingestion_runs")
    .update({
      finished_at: new Date().toISOString(),
      status,
      parser_errors: parserErrors,
    })
    .eq("id", run.id)
    .select()
    .single();

  if (completionError) throw completionError;

  return { run: completedRun, source, fetched: listings.length, stored, parserErrors };
}

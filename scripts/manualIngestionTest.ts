import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types";

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const envFile = readFileSync(envPath, "utf8");

  for (const line of envFile.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex);
    const value = trimmedLine.slice(separatorIndex + 1);

    process.env[key] ??= value;
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SERVICE_ROLE_KEY
  );
}

async function getOrCreateManualListingSource(
  supabase: ReturnType<typeof createClient<Database>>,
) {
  const { data: existingSource, error: selectError } = await supabase
    .from("listing_sources")
    .select("*")
    .eq("source_name", "manual_test")
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existingSource) {
    return existingSource;
  }

  const { data: createdSource, error: insertError } = await supabase
    .from("listing_sources")
    .insert({
      source_name: "manual_test",
      source_type: "marketplace",
      base_url: "manual://revmatched/manual-test",
      notes: "Local manual ingestion test source. Not scraped.",
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return createdSource;
}

async function main() {
  loadLocalEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getServiceRoleKey();

  assert(supabaseUrl, "Missing NEXT_PUBLIC_SUPABASE_URL.");
  assert(
    serviceRoleKey,
    "Missing SUPABASE_SERVICE_ROLE_KEY. Use the local Supabase service_role key from `npx supabase status`.",
  );

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const listingSource = await getOrCreateManualListingSource(supabase);
  const now = new Date();
  const sourceListingId = `manual-test-${now.getTime()}`;
  const sourceListingUrl = `manual://revmatched/manual-test/${sourceListingId}`;
  const rawPayload = {
    source: "manual_test",
    scraped_at: now.toISOString(),
    listing: {
      id: sourceListingId,
      url: sourceListingUrl,
      title: "2020 Toyota Corolla Hybrid",
      description:
        "Clean local-used Corolla Hybrid. Automatic transmission. Recently serviced. Manual ingestion test record only.",
      price: "TT$118,000 negotiable",
      location: "San Fernando",
      contact: "WhatsApp 868-555-0199",
      seller: "Private seller",
      mileage: "65,000 km",
      fuel: "Hybrid",
      transmission: "Automatic",
      trim: "G",
      images: [
        "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  };

  const { data: ingestionRun, error: ingestionRunError } = await supabase
    .from("ingestion_runs")
    .insert({
      listing_source_id: listingSource.id,
      status: "running",
      listings_fetched: 1,
      listings_normalized: 0,
      parser_errors: 0,
      duplicate_warnings: 0,
      run_notes: "Manual hardcoded ingestion test. No scraping performed.",
    })
    .select()
    .single();

  if (ingestionRunError) {
    throw ingestionRunError;
  }

  const { data: rawListing, error: rawListingError } = await supabase
    .from("raw_listings")
    .insert({
      listing_source_id: listingSource.id,
      ingestion_run_id: ingestionRun.id,
      source_listing_id: sourceListingId,
      source_listing_url: sourceListingUrl,
      raw_title: rawPayload.listing.title,
      raw_description: rawPayload.listing.description,
      raw_price_text: rawPayload.listing.price,
      raw_location_text: rawPayload.listing.location,
      raw_contact_text: rawPayload.listing.contact,
      raw_seller_label: rawPayload.listing.seller,
      raw_mileage_text: rawPayload.listing.mileage,
      raw_fuel_text: rawPayload.listing.fuel,
      raw_transmission_text: rawPayload.listing.transmission,
      raw_trim_text: rawPayload.listing.trim,
      raw_payload: rawPayload,
      fetched_at: now.toISOString(),
    })
    .select()
    .single();

  if (rawListingError) {
    throw rawListingError;
  }

  const { data: rawListingImages, error: rawListingImagesError } = await supabase
    .from("raw_listing_images")
    .insert(
      rawPayload.listing.images.map((imageUrl, index) => ({
        raw_listing_id: rawListing.id,
        image_url: imageUrl,
        display_order: index,
        source_attribution_required: true,
        preview_allowed: false,
      })),
    )
    .select()
    .order("display_order", { ascending: true });

  if (rawListingImagesError) {
    throw rawListingImagesError;
  }

  const { data: completedRun, error: completedRunError } = await supabase
    .from("ingestion_runs")
    .update({
      finished_at: new Date().toISOString(),
      status: "completed",
    })
    .eq("id", ingestionRun.id)
    .select()
    .single();

  if (completedRunError) {
    throw completedRunError;
  }

  console.log("Manual ingestion test inserted one raw listing.");
  console.log({
    listing_source_id: listingSource.id,
    ingestion_run_id: completedRun.id,
    raw_listing_id: rawListing.id,
    raw_listing_image_ids: rawListingImages.map((image) => image.id),
    source_listing_id: rawListing.source_listing_id,
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { DEFAULT_BRANDS } from "../lib/brands";
import type { Database, Tables } from "../lib/database.types";
import {
  parseContactMethod,
  parseImportStatus,
  parseMileageText,
  parsePriceText,
  parseSellerType,
  parseYearFromText,
} from "../lib/normalization/parseListingFields";

type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;
type RawListing = Tables<"raw_listings">;
type RawListingImage = Tables<"raw_listing_images">;
type NormalizedListingInsert =
  Database["public"]["Tables"]["normalized_listings"]["Insert"];

const fallbackBrandModel = {
  brand: "Unknown make",
  model: "Unknown model",
};

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

function parseBrandModel(title: string | null) {
  const normalizedTitle = title?.trim() ?? "";
  const yearlessTitle = normalizedTitle
    .replace(/\b(19|20)\d{2}\b/, "")
    .replace(/\s+/g, " ")
    .trim();
  const brand = DEFAULT_BRANDS.find((candidate) =>
    new RegExp(`\\b${candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      yearlessTitle,
    ),
  );

  if (!brand) {
    return fallbackBrandModel;
  }

  const model = yearlessTitle
    .replace(new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), "")
    .replace(/\bhybrid\b/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    brand,
    model: model || fallbackBrandModel.model,
  };
}

function parseBodyType(title: string | null, model: string) {
  const combinedValue = `${title ?? ""} ${model}`.toLowerCase();

  if (combinedValue.includes("suv") || combinedValue.includes("cross")) {
    return "suv";
  }

  if (combinedValue.includes("pickup") || combinedValue.includes("truck")) {
    return "pickup";
  }

  if (combinedValue.includes("note") || combinedValue.includes("hatch")) {
    return "hatchback";
  }

  if (combinedValue.includes("corolla") || combinedValue.includes("axio")) {
    return "sedan";
  }

  return null;
}

function buildDisplayName(input: {
  brand: string;
  model: string;
  title: string | null;
  year: number | null;
}) {
  if (input.brand === fallbackBrandModel.brand || input.model === fallbackBrandModel.model) {
    return input.title?.trim() || "Manual normalized listing";
  }

  return [input.year, input.brand, input.model].filter(Boolean).join(" ");
}

async function getManualTestSource(supabase: TypedSupabaseClient) {
  const { data, error } = await supabase
    .from("listing_sources")
    .select("*")
    .eq("source_name", "manual_test")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getLatestManualRawListing(
  supabase: TypedSupabaseClient,
  listingSourceId: string,
) {
  const { data, error } = await supabase
    .from("raw_listings")
    .select("*")
    .eq("listing_source_id", listingSourceId)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getRawListingImages(
  supabase: TypedSupabaseClient,
  rawListingId: string,
) {
  const { data, error } = await supabase
    .from("raw_listing_images")
    .select("*")
    .eq("raw_listing_id", rawListingId)
    .order("display_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

async function findExistingNormalizedListing(
  supabase: TypedSupabaseClient,
  rawListing: RawListing,
) {
  let query = supabase
    .from("normalized_listings")
    .select("*")
    .eq("listing_source_id", rawListing.listing_source_id);

  if (rawListing.source_listing_id) {
    query = query.or(
      `raw_listing_id.eq.${rawListing.id},source_listing_id.eq.${rawListing.source_listing_id}`,
    );
  } else {
    query = query.eq("raw_listing_id", rawListing.id);
  }

  const { data, error } = await query
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function removeExistingNormalizedImages(
  supabase: TypedSupabaseClient,
  normalizedListingId: string,
) {
  const { error } = await supabase
    .from("normalized_listing_images")
    .delete()
    .eq("normalized_listing_id", normalizedListingId);

  if (error) {
    throw error;
  }
}

function buildNormalizedListingValues(
  rawListing: RawListing,
): NormalizedListingInsert {
  const year = parseYearFromText(
    `${rawListing.raw_title ?? ""} ${rawListing.raw_description ?? ""}`,
  );
  const { brand, model } = parseBrandModel(rawListing.raw_title);
  const bodyType = parseBodyType(rawListing.raw_title, model);
  const displayName = buildDisplayName({
    brand,
    model,
    title: rawListing.raw_title,
    year,
  });

  return {
    raw_listing_id: rawListing.id,
    listing_source_id: rawListing.listing_source_id,
    source_listing_id: rawListing.source_listing_id,
    source_listing_url: rawListing.source_listing_url,
    display_name: displayName,
    title: rawListing.raw_title,
    price_amount: parsePriceText(rawListing.raw_price_text),
    year,
    brand_name: brand,
    model_name: model,
    trim_name: rawListing.raw_trim_text,
    mileage_value: parseMileageText(rawListing.raw_mileage_text),
    fuel_type: rawListing.raw_fuel_text?.toLowerCase() ?? null,
    transmission_type: rawListing.raw_transmission_text?.toLowerCase() ?? null,
    body_type: bodyType,
    location_label: rawListing.raw_location_text,
    seller_type: parseSellerType(rawListing.raw_seller_label),
    contact_method: parseContactMethod(rawListing.raw_contact_text),
    import_status: parseImportStatus(
      `${rawListing.raw_title ?? ""} ${rawListing.raw_description ?? ""} ${
        rawListing.raw_trim_text ?? ""
      }`,
    ),
    availability_status: "available",
    review_status: "approved",
    recommendation_state: "eligible",
    is_buyer_visible: true,
    buyer_visibility_reason:
      "Manual normalization test listing approved for local buyer visibility.",
    normalization_confidence: 0.85,
    source_attribution_required: true,
    source_images_allowed_for_preview: true,
  };
}

async function upsertNormalizedListingForRawListing(
  supabase: TypedSupabaseClient,
  rawListing: RawListing,
) {
  const existingListing = await findExistingNormalizedListing(
    supabase,
    rawListing,
  );
  const normalizedListingValues = buildNormalizedListingValues(rawListing);

  if (existingListing) {
    const { data, error } = await supabase
      .from("normalized_listings")
      .update(normalizedListingValues)
      .eq("id", existingListing.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      listing: data,
      mode: "updated" as const,
    };
  }

  const { data, error } = await supabase
    .from("normalized_listings")
    .insert(normalizedListingValues)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    listing: data,
    mode: "inserted" as const,
  };
}

async function createNormalizedListingImages(input: {
  supabase: TypedSupabaseClient;
  normalizedListingId: string;
  rawListingImages: RawListingImage[];
}) {
  const { supabase, normalizedListingId, rawListingImages } = input;

  if (rawListingImages.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("normalized_listing_images")
    .insert(
      rawListingImages.map((image, index) => ({
        normalized_listing_id: normalizedListingId,
        raw_listing_image_id: image.id,
        display_url: image.image_url,
        display_order: image.display_order,
        is_primary: index === 0,
        preview_allowed: true,
        source_attribution_required: image.source_attribution_required,
      })),
    )
    .select()
    .order("display_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
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
  const listingSource = await getManualTestSource(supabase);
  const rawListing = await getLatestManualRawListing(supabase, listingSource.id);
  const rawListingImages = await getRawListingImages(supabase, rawListing.id);

  const { listing: normalizedListing, mode } =
    await upsertNormalizedListingForRawListing(supabase, rawListing);

  await removeExistingNormalizedImages(supabase, normalizedListing.id);

  const normalizedListingImages = await createNormalizedListingImages({
    supabase,
    normalizedListingId: normalizedListing.id,
    rawListingImages,
  });

  console.log(`Manual normalization test ${mode} one normalized listing.`);
  console.log({
    listing_source_id: normalizedListing.listing_source_id,
    raw_listing_id: normalizedListing.raw_listing_id,
    source_listing_id: normalizedListing.source_listing_id,
    normalized_listing_id: normalizedListing.id,
    normalized_listing_image_ids: normalizedListingImages.map(
      (image) => image.id,
    ),
    parsed_fields: {
      title: normalizedListing.title,
      price_amount: normalizedListing.price_amount,
      year: normalizedListing.year,
      brand_name: normalizedListing.brand_name,
      model_name: normalizedListing.model_name,
      body_type: normalizedListing.body_type,
      location_label: normalizedListing.location_label,
      mileage_value: normalizedListing.mileage_value,
    },
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

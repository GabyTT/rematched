import { DEFAULT_BRANDS } from "../brands.ts";
import type { Database, Tables } from "../database.types.ts";
import { evaluateListingEligibility } from "./evaluateListingEligibility.ts";
import { evaluateNormalizationConfidence } from "./evaluateNormalizationConfidence.ts";
import {
  parseContactMethod,
  parseImportStatus,
  parseMileageText,
  parsePriceText,
  parseSellerType,
  parseYearFromText,
} from "./parseListingFields.ts";

type RawListing = Tables<"raw_listings">;
type RawListingImage = Tables<"raw_listing_images">;
type NormalizedListingInsert =
  Database["public"]["Tables"]["normalized_listings"]["Insert"];

const knownModels = [
  { brand: "Toyota", bodyType: "sedan", matchers: ["corolla"], model: "Corolla" },
  { brand: "Toyota", bodyType: "sedan", matchers: ["axio"], model: "Corolla Axio" },
  { brand: "Toyota", bodyType: "suv", matchers: ["yaris cross"], model: "Yaris Cross" },
  { brand: "Nissan", bodyType: "hatchback", matchers: ["nissan note"], model: "Note" },
] as const;

function normalizedText(value: string | null) {
  return value?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

function structuredString(rawListing: RawListing, key: string) {
  const payload = rawListing.raw_payload;
  if (!payload || Array.isArray(payload) || typeof payload !== "object") return null;
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function structuredBoolean(rawListing: RawListing, key: string) {
  const payload = rawListing.raw_payload;
  if (!payload || Array.isArray(payload) || typeof payload !== "object") return false;
  return payload[key] === true;
}

function parseBrandModel(rawListing: RawListing) {
  const structuredBrand = structuredString(rawListing, "make");
  const structuredModel = structuredString(rawListing, "model");
  const structuredBodyType = structuredString(rawListing, "body_type");

  if (structuredBrand || structuredModel) {
    return {
      bodyType: structuredBodyType?.toLowerCase() ?? null,
      brandName: structuredBrand,
      modelName: structuredModel,
    };
  }

  const combined = normalizedText(
    `${rawListing.raw_title ?? ""} ${rawListing.raw_description ?? ""}`,
  );

  for (const knownModel of knownModels) {
    if (knownModel.matchers.some((matcher) => combined.includes(matcher))) {
      return {
        bodyType: knownModel.bodyType,
        brandName: knownModel.brand,
        modelName: knownModel.model,
      };
    }
  }

  const brand = DEFAULT_BRANDS.find((candidate) =>
    new RegExp(
      `\\b${candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    ).test(combined),
  );

  return { bodyType: null, brandName: brand ?? null, modelName: null };
}

function imageHealth(images: RawListingImage[]) {
  if (images.length === 0) return "missing" as const;
  if (images.some((image) => !image.image_url.trim())) return "broken" as const;
  return "linked" as const;
}

function databaseReviewStatus(status: "approved" | "needs_review" | "rejected") {
  return status === "needs_review" ? "review_required" : status;
}

export function normalizeRawListing(
  rawListing: RawListing,
  images: RawListingImage[],
): NormalizedListingInsert {
  const isPrivateTest = structuredBoolean(rawListing, "test_mode");
  const { bodyType, brandName, modelName } = parseBrandModel(rawListing);
  const contactMethod = parseContactMethod(rawListing.raw_contact_text);
  const importStatus = parseImportStatus(
    `${rawListing.raw_title ?? ""} ${rawListing.raw_description ?? ""} ${
      rawListing.raw_trim_text ?? ""
    }`,
  );
  const mileageValue = parseMileageText(rawListing.raw_mileage_text);
  const priceAmount = parsePriceText(rawListing.raw_price_text);
  const colour = structuredString(rawListing, "colour") ?? rawListing.raw_colour_text;
  const engineSize =
    structuredString(rawListing, "engine_size") ?? rawListing.raw_engine_size_text;
  const plateSeries =
    structuredString(rawListing, "plate_series") ?? rawListing.raw_plate_series_text;
  const isNegotiable =
    structuredBoolean(rawListing, "is_negotiable") ||
    rawListing.raw_is_negotiable ||
    /\bnegotiable\b/i.test(rawListing.raw_price_text ?? "");
  const sellerType = parseSellerType(rawListing.raw_seller_label);
  const year = parseYearFromText(
    `${rawListing.raw_title ?? ""} ${rawListing.raw_description ?? ""}`,
  );
  const currentImageHealth = imageHealth(images);
  const eligibility = evaluateListingEligibility({
    bodyType,
    brandName,
    contactMethod,
    imageHealth: currentImageHealth,
    locationLabel: rawListing.raw_location_text,
    mileageValue,
    modelName,
    priceAmount,
    rawPriceText: rawListing.raw_price_text,
    rawTitle: rawListing.raw_title,
    sellerType,
    year,
  });
  const confidence = evaluateNormalizationConfidence({
    bodyType,
    brandName,
    contactMethod,
    imageHealth: currentImageHealth,
    importStatus,
    locationLabel: rawListing.raw_location_text,
    mileageValue,
    modelName,
    priceAmount,
    rawMileageText: rawListing.raw_mileage_text,
    rawPriceText: rawListing.raw_price_text,
    rawTitle: rawListing.raw_title,
    sellerType,
    year,
  });
  const displayName =
    [year, brandName, modelName].filter(Boolean).join(" ") ||
    rawListing.raw_title?.trim() ||
    "Untitled listing";

  return {
    raw_listing_id: rawListing.id,
    listing_source_id: rawListing.listing_source_id,
    source_listing_id: rawListing.source_listing_id,
    source_listing_url: rawListing.source_listing_url,
    display_name: displayName,
    title: rawListing.raw_title,
    price_amount: priceAmount,
    year,
    brand_name: brandName,
    model_name: modelName,
    trim_name: rawListing.raw_trim_text,
    colour,
    engine_size: engineSize,
    plate_series: plateSeries,
    is_negotiable: isNegotiable,
    mileage_value: mileageValue,
    fuel_type: normalizedText(rawListing.raw_fuel_text) || null,
    transmission_type: normalizedText(rawListing.raw_transmission_text) || null,
    body_type: bodyType,
    location_label: rawListing.raw_location_text,
    seller_type: sellerType,
    contact_method: contactMethod,
    import_status: importStatus,
    availability_status: "available",
    review_status: databaseReviewStatus(eligibility.review_status),
    recommendation_state: isPrivateTest ? "hidden" : eligibility.recommendation_state,
    is_buyer_visible: isPrivateTest ? false : eligibility.is_buyer_visible,
    buyer_visibility_reason: isPrivateTest
      ? "Private source-ingestion test; Admin review only."
      : eligibility.buyer_visibility_reason,
    normalization_confidence: confidence.normalization_confidence,
    source_attribution_required: true,
    source_images_allowed_for_preview:
      images.length > 0 && images.every((image) => image.preview_allowed),
  };
}

import { strict as assert } from "node:assert";

import type { Tables } from "../lib/database.types";
import {
  mapNormalizedListingToCar,
  mapNormalizedListingsToCars,
} from "../lib/normalizedListingCarAdapter";

type NormalizedListing = Tables<"normalized_listings">;
type NormalizedListingImage = Tables<"normalized_listing_images">;

const now = "2026-05-05T12:00:00.000Z";

const visibleListing: NormalizedListing = {
  availability_status: "available",
  body_type: "compact_suv",
  brand_name: "Toyota",
  buyer_visibility_reason: "Smoke-test approved listing",
  contact_method: "whatsapp",
  created_at: now,
  display_name: "2020 Toyota Corolla Cross",
  fuel_type: "gasoline",
  id: "normalized-adapter-visible",
  import_status: "local_used",
  is_buyer_visible: true,
  listing_source_id: "source-adapter",
  location_label: "San Fernando",
  mileage_value: 65200,
  model_name: "Corolla Cross",
  normalization_confidence: 0.94,
  price_amount: 118500,
  raw_listing_id: "raw-adapter-visible",
  recommendation_state: "eligible",
  review_status: "approved",
  seller_type: "private",
  source_attribution_required: true,
  source_images_allowed_for_preview: true,
  source_listing_id: "adapter-visible",
  source_listing_url: "https://example.test/adapter-visible",
  title: "Toyota Corolla Cross 2020",
  transmission_type: "automatic",
  trim_name: null,
  updated_at: now,
  year: 2020,
};

const images: NormalizedListingImage[] = [
  {
    created_at: now,
    display_order: 1,
    display_url: "https://example.test/secondary.jpg",
    id: "image-secondary",
    is_primary: false,
    normalized_listing_id: visibleListing.id,
    preview_allowed: true,
    raw_listing_image_id: null,
    source_attribution_required: true,
    updated_at: now,
  },
  {
    created_at: now,
    display_order: 0,
    display_url: "https://example.test/primary.jpg",
    id: "image-primary",
    is_primary: true,
    normalized_listing_id: visibleListing.id,
    preview_allowed: true,
    raw_listing_image_id: null,
    source_attribution_required: true,
    updated_at: now,
  },
  {
    created_at: now,
    display_order: 0,
    display_url: "https://example.test/blocked.jpg",
    id: "image-blocked",
    is_primary: true,
    normalized_listing_id: visibleListing.id,
    preview_allowed: false,
    raw_listing_image_id: null,
    source_attribution_required: true,
    updated_at: now,
  },
];

const mappedCar = mapNormalizedListingToCar(visibleListing, images);

assert.equal(mappedCar.id, visibleListing.id);
assert.equal(mappedCar.name, "2020 Toyota Corolla Cross");
assert.equal(mappedCar.year, 2020);
assert.equal(mappedCar.make, "Toyota");
assert.equal(mappedCar.brand, "Toyota");
assert.equal(mappedCar.model, "Corolla Cross");
assert.equal(mappedCar.price, "$118,500 TTD");
assert.equal(mappedCar.priceValue, 118500);
assert.equal(mappedCar.mileage, "65,200 km");
assert.equal(mappedCar.fuel, "Gasoline");
assert.equal(mappedCar.transmission, "Automatic");
assert.equal(mappedCar.location, "San Fernando");
assert.equal(mappedCar.category, "Compact Suv");
assert.equal(mappedCar.vehicleType, "suv");
assert.equal(mappedCar.image, "https://example.test/primary.jpg");
assert.equal(mappedCar.ingestionListingId, "raw-adapter-visible");

const fallbackCar = mapNormalizedListingToCar({
  ...visibleListing,
  id: "normalized-adapter-fallback",
  body_type: null,
  brand_name: null,
  fuel_type: null,
  location_label: null,
  mileage_value: null,
  model_name: null,
  price_amount: null,
  raw_listing_id: null,
  transmission_type: null,
  year: null,
});

assert.equal(fallbackCar.price, "Price on request");
assert.equal(fallbackCar.priceValue, 0);
assert.equal(fallbackCar.mileage, "Mileage not listed");
assert.equal(fallbackCar.fuel, "Fuel not listed");
assert.equal(fallbackCar.transmission, "Transmission not listed");
assert.equal(fallbackCar.location, "Location not listed");
assert.equal(fallbackCar.category, "Available listing");
assert.equal(fallbackCar.vehicleType, "other");
assert.equal(fallbackCar.brand, "Unknown make");
assert.equal(fallbackCar.model, "Unknown model");
assert.equal(fallbackCar.ingestionListingId, "normalized-adapter-fallback");

const mappedCars = mapNormalizedListingsToCars([visibleListing], images);

assert.equal(mappedCars.length, 1);
assert.equal(mappedCars[0]?.image, "https://example.test/primary.jpg");

console.log("Normalized listing car adapter smoke test passed.");

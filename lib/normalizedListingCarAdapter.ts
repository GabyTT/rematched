import type { Car } from "@/lib/cars";
import type { Tables } from "@/lib/database.types";

type NormalizedListing = Tables<"normalized_listings">;
type NormalizedListingImage = Tables<"normalized_listing_images">;

const FALLBACK_CAR_IMAGE =
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80";

function formatCurrencyTtd(value: number | null) {
  if (value === null) {
    return "Price on request";
  }

  return `$${Math.round(value).toLocaleString("en-US")} TTD`;
}

function formatMileage(value: number | null) {
  if (value === null) {
    return "Mileage not listed";
  }

  return `${Math.round(value).toLocaleString("en-US")} km`;
}

function formatLabel(value: string | null, fallback: string) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return fallback;
  }

  return trimmedValue
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeVehicleType(bodyType: string | null) {
  const normalizedBodyType = bodyType?.trim().toLowerCase().replace(/_/g, "-");

  if (!normalizedBodyType) {
    return "other";
  }

  if (normalizedBodyType.includes("suv")) {
    return "suv";
  }

  if (normalizedBodyType.includes("pickup") || normalizedBodyType.includes("truck")) {
    return "pickup";
  }

  if (normalizedBodyType.includes("hatch")) {
    return "hatchback";
  }

  if (normalizedBodyType.includes("sedan")) {
    return "sedan";
  }

  if (normalizedBodyType.includes("luxury")) {
    return "luxury";
  }

  return normalizedBodyType;
}

function chooseListingImage(
  listing: NormalizedListing,
  images: NormalizedListingImage[],
) {
  return images
    .filter(
      (image) =>
        image.normalized_listing_id === listing.id &&
        image.preview_allowed &&
        image.display_url.trim() !== "",
    )
    .sort((left, right) => {
      if (left.is_primary !== right.is_primary) {
        return left.is_primary ? -1 : 1;
      }

      return left.display_order - right.display_order;
    })[0]?.display_url ?? FALLBACK_CAR_IMAGE;
}

export function mapNormalizedListingToCar(
  listing: NormalizedListing,
  images: NormalizedListingImage[] = [],
): Car {
  const brand = listing.brand_name?.trim() || "Unknown make";
  const model = listing.model_name?.trim() || "Unknown model";
  const vehicleType = normalizeVehicleType(listing.body_type);

  return {
    id: listing.id,
    name: listing.display_name,
    year: listing.year ?? 0,
    make: brand,
    price: formatCurrencyTtd(listing.price_amount),
    priceValue: listing.price_amount ?? 0,
    mileage: formatMileage(listing.mileage_value),
    fuel: formatLabel(listing.fuel_type, "Fuel not listed"),
    transmission: formatLabel(
      listing.transmission_type,
      "Transmission not listed",
    ),
    location: listing.location_label?.trim() || "Location not listed",
    category: formatLabel(listing.body_type, "Available listing"),
    vehicleType,
    brand,
    model,
    image: chooseListingImage(listing, images),
    ingestionListingId: listing.raw_listing_id ?? listing.id,
  };
}

export function mapNormalizedListingsToCars(
  listings: NormalizedListing[],
  images: NormalizedListingImage[] = [],
) {
  return listings.map((listing) => mapNormalizedListingToCar(listing, images));
}

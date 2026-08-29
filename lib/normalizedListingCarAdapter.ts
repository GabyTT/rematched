import type { Car } from "./cars.ts";
import type { Tables } from "./database.types.ts";
import type { BuyerVisibleNormalizedListing } from "./normalizedListings.ts";

type NormalizedListing = BuyerVisibleNormalizedListing;
type NormalizedListingImage = Tables<"normalized_listing_images">;
type BuyerListingImage = Pick<
  NormalizedListingImage,
  | "normalized_listing_id"
  | "preview_allowed"
  | "display_url"
  | "is_primary"
  | "display_order"
>;

const FALLBACK_CAR_IMAGE = "/ai-car-placeholder.png";

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

function cleanOptionalLabel(value: string | null) {
  return value?.trim() ?? "";
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

function getApprovedListingImages(
  listing: NormalizedListing,
  images: BuyerListingImage[],
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
    })
    .map((image) => image.display_url)
    .filter((imageUrl, index, imageUrls) => imageUrls.indexOf(imageUrl) === index);
}

function chooseListingImage(
  listing: NormalizedListing,
  images: BuyerListingImage[],
) {
  const approvedImages = getApprovedListingImages(listing, images);
  const authorizedImage = approvedImages[0];

  return authorizedImage
    ? { image: authorizedImage, images: approvedImages, imageIsPlaceholder: false }
    : { image: FALLBACK_CAR_IMAGE, images: [], imageIsPlaceholder: true };
}

export function mapNormalizedListingToCar(
  listing: NormalizedListing,
  images: BuyerListingImage[] = [],
): Car {
  const brand = listing.brand_name?.trim() || "Unknown make";
  const model = listing.model_name?.trim() || "Unknown model";
  const vehicleType = normalizeVehicleType(listing.body_type);
  const listingImage = chooseListingImage(listing, images);
  const plateSeries = cleanOptionalLabel(listing.plate_series);
  const colour = cleanOptionalLabel(listing.colour);
  const engineSize = cleanOptionalLabel(listing.engine_size);
  const transmission = formatLabel(
    listing.transmission_type,
    "Transmission not listed",
  );
  const facts = [
    plateSeries ? `Series ${plateSeries}` : null,
    colour,
    engineSize,
    listing.mileage_value === null ? null : formatMileage(listing.mileage_value),
    listing.transmission_type?.trim() ? transmission : null,
  ].filter((fact): fact is string => Boolean(fact));

  return {
    id: listing.id,
    name: listing.display_name,
    year: listing.year ?? 0,
    make: brand,
    price: formatCurrencyTtd(listing.price_amount),
    priceValue: listing.price_amount ?? 0,
    mileage: formatMileage(listing.mileage_value),
    fuel: formatLabel(listing.fuel_type, "Fuel not listed"),
    transmission,
    location: listing.location_label?.trim() || "Location not listed",
    category: formatLabel(listing.body_type, ""),
    vehicleType,
    brand,
    model,
    plateSeries,
    colour,
    engineSize,
    isNegotiable: listing.is_negotiable,
    facts,
    image: listingImage.image,
    images: listingImage.images,
    imageIsPlaceholder: listingImage.imageIsPlaceholder,
    sellerContactName: listing.public_contact_name,
    sellerContactPhone: listing.public_contact_phone,
    availabilityStatus: listing.availability_status,
    soldAt: listing.sold_at,
  };
}

export function mapNormalizedListingsToCars(
  listings: NormalizedListing[],
  images: BuyerListingImage[] = [],
) {
  return listings.map((listing) => mapNormalizedListingToCar(listing, images));
}

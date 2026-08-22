export type SourceListingImage = {
  url: string;
  previewAllowed?: boolean;
};

export type SourceListing = {
  sourceListingId: string;
  sourceListingUrl: string;
  title?: string | null;
  description?: string | null;
  priceText?: string | null;
  locationText?: string | null;
  contactText?: string | null;
  sellerLabel?: string | null;
  mileageText?: string | null;
  fuelText?: string | null;
  transmissionText?: string | null;
  trimText?: string | null;
  featuresText?: string | null;
  colourText?: string | null;
  engineSizeText?: string | null;
  plateSeriesText?: string | null;
  isNegotiable?: boolean;
  images?: SourceListingImage[];
  rawPayload: Record<string, unknown>;
  fetchedAt?: string;
  sourcePostedAt?: string | null;
  sourcePostedText?: string | null;
  sourceRefreshedAt?: string | null;
  sourceRefreshedText?: string | null;
};

export type ListingSourceAdapter = {
  source: {
    name: string;
    type: "marketplace" | "dealer_site" | "dealer_feed" | "native_revmatched";
    baseUrl?: string | null;
    notes?: string | null;
  };
  fetchListings(): Promise<SourceListing[]>;
};

export function validateSourceListing(listing: SourceListing, index: number) {
  const prefix = `Listing ${index + 1}`;

  if (!listing.sourceListingId.trim()) {
    throw new Error(`${prefix} is missing a stable sourceListingId.`);
  }

  if (!listing.sourceListingUrl.trim()) {
    throw new Error(`${prefix} is missing sourceListingUrl.`);
  }

  try {
    const sourceUrl = new URL(listing.sourceListingUrl);

    if (sourceUrl.protocol !== "http:" && sourceUrl.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new Error(`${prefix} must use an HTTP or HTTPS sourceListingUrl.`);
  }

  listing.images?.forEach((image, imageIndex) => {
    try {
      const imageUrl = new URL(image.url);

      if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") {
        throw new Error("unsupported protocol");
      }
    } catch {
      throw new Error(`${prefix}, image ${imageIndex + 1}, must use an HTTP or HTTPS URL.`);
    }
  });
}

export async function fetchValidatedListings(adapter: ListingSourceAdapter) {
  const listings = await adapter.fetchListings();
  const seenIds = new Set<string>();

  listings.forEach((listing, index) => {
    validateSourceListing(listing, index);

    if (seenIds.has(listing.sourceListingId)) {
      throw new Error(
        `Source returned duplicate sourceListingId: ${listing.sourceListingId}.`,
      );
    }

    seenIds.add(listing.sourceListingId);
  });

  return listings;
}

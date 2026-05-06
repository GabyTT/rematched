export type ListingSource =
  | "TriniCars"
  | "PinTT Cars"
  | "TT Motor Sales"
  | "Facebook Marketplace"
  | "Dealer Feed Pilot";

export type ListingAvailabilityStatus =
  | "active"
  | "stale"
  | "inactive"
  | "unavailable";

export type RecommendationEligibility =
  | "eligible"
  | "limited"
  | "review_required"
  | "hidden";

export type RecommendationReason =
  | "freshness_untrusted"
  | "missing_critical_fields"
  | "duplicate_under_review"
  | "normalization_uncertain"
  | "attribution_review"
  | "image_coverage_limited"
  | "structured_fields_partial";

export type ReviewStatus =
  | "approved"
  | "needs_review"
  | "pending";

export type IngestionRunStatus =
  | "completed"
  | "running"
  | "partial"
  | "failed";

export type ReviewReason =
  | "missing_price"
  | "missing_brand_model"
  | "uncertain_normalization"
  | "duplicate_warning"
  | "stale_availability"
  | "image_attribution_concern";

export type DuplicateWarningStatus =
  | "open"
  | "accepted"
  | "dismissed";

export type RawListing = {
  id: string;
  source: ListingSource;
  ingestionRunId: string;
  sourceListingId: string | null;
  sourceListingUrl: string | null;
  rawTitle: string;
  rawDescription: string | null;
  rawPriceText: string | null;
  rawLocationText: string | null;
  rawContactText: string | null;
  rawSellerLabel: string | null;
  rawMileageText: string | null;
  rawFuelText: string | null;
  rawTransmissionText: string | null;
  rawTrimText: string | null;
  rawImageUrls: string[];
  fetchedAt: string;
};

export type NormalizedListing = {
  id: string;
  rawListingId: string;
  source: ListingSource;
  sourceListingId: string | null;
  sourceListingUrl: string | null;
  title: string;
  displayName: string;
  priceAmount: number | null;
  year: number | null;
  brand: string | null;
  model: string | null;
  trim: string | null;
  mileageValue: number | null;
  fuelType: string | null;
  transmissionType: string | null;
  bodyType: string | null;
  locationLabel: string | null;
  sellerType: string | null;
  contactMethod: string | null;
  importStatus: string | null;
  availabilityStatus: ListingAvailabilityStatus;
  recommendationEligibility: RecommendationEligibility;
  recommendationReasons: RecommendationReason[];
  confidenceNotes: string[];
  normalizationConfidence: "high" | "medium" | "low";
  sourceAttributionRequired: boolean;
  sourceImagesAllowedForPreview: boolean;
};

export type ListingReviewRecord = {
  id: string;
  listingId: string;
  reviewStatus: ReviewStatus;
  reviewReasons: ReviewReason[];
  assignedQueue: "normalization" | "duplicates" | "freshness" | "attribution";
  adminNote: string | null;
  reviewedAt: string | null;
};

export type DuplicateWarning = {
  id: string;
  listingId: string;
  possibleDuplicateListingIds: string[];
  confidenceScore: number;
  matchedSignals: string[];
  status: DuplicateWarningStatus;
};

export type AdminIngestionRun = {
  id: string;
  source: ListingSource;
  startedAt: string;
  finishedAt: string | null;
  status: IngestionRunStatus;
  listingsFetched: number;
  listingsNormalized: number;
  parserErrors: number;
  duplicateWarnings: number;
};

export type AdminListing = {
  id: string;
  source: ListingSource;
  sourceListingId: string;
  sourceUrl: string | null;
  title: string;
  priceAmount: number | null;
  year: number | null;
  brand: string | null;
  model: string | null;
  availabilityStatus: ListingAvailabilityStatus;
  recommendationEligibility: RecommendationEligibility;
  recommendationReasons: RecommendationReason[];
  confidenceNotes: string[];
  reviewStatus: ReviewStatus;
  duplicateWarning: boolean;
  uncertainNormalization: boolean;
  imageAttributionConcern: boolean;
  reviewReasons: ReviewReason[];
};

export const adminIngestionRuns: AdminIngestionRun[] = [
  {
    id: "run-trinicars-2026-05-03-0730",
    source: "TriniCars",
    startedAt: "2026-05-03T07:30:00-04:00",
    finishedAt: "2026-05-03T07:41:00-04:00",
    status: "partial",
    listingsFetched: 34,
    listingsNormalized: 24,
    parserErrors: 6,
    duplicateWarnings: 2,
  },
  {
    id: "run-pintt-2026-05-03-0800",
    source: "PinTT Cars",
    startedAt: "2026-05-03T08:00:00-04:00",
    finishedAt: "2026-05-03T08:06:00-04:00",
    status: "completed",
    listingsFetched: 46,
    listingsNormalized: 39,
    parserErrors: 3,
    duplicateWarnings: 5,
  },
  {
    id: "run-facebook-2026-05-03-0615",
    source: "Facebook Marketplace",
    startedAt: "2026-05-03T06:15:00-04:00",
    finishedAt: "2026-05-03T06:17:00-04:00",
    status: "failed",
    listingsFetched: 7,
    listingsNormalized: 0,
    parserErrors: 7,
    duplicateWarnings: 0,
  },
  {
    id: "run-dealer-pilot-2026-05-03-0910",
    source: "Dealer Feed Pilot",
    startedAt: "2026-05-03T09:10:00-04:00",
    finishedAt: null,
    status: "running",
    listingsFetched: 18,
    listingsNormalized: 12,
    parserErrors: 0,
    duplicateWarnings: 1,
  },
  {
    id: "run-ttms-2026-05-02-1730",
    source: "TT Motor Sales",
    startedAt: "2026-05-02T17:30:00-04:00",
    finishedAt: "2026-05-02T17:36:00-04:00",
    status: "completed",
    listingsFetched: 22,
    listingsNormalized: 18,
    parserErrors: 1,
    duplicateWarnings: 1,
  },
];

export const mockRawListings: RawListing[] = [
  {
    id: "raw-1",
    source: "TriniCars",
    ingestionRunId: "run-trinicars-2026-05-03-0730",
    sourceListingId: "tc-axio-2016-001",
    sourceListingUrl: "https://example.com/trinicars/axio-2016",
    rawTitle: "Toyota Axio 2016 PDZ",
    rawDescription:
      "PDZ series. Very clean. Hybrid. Call or WhatsApp after 5pm.",
    rawPriceText: "TT$90,000",
    rawLocationText: "Arima",
    rawContactText: "WhatsApp only after 5pm",
    rawSellerLabel: "Private seller",
    rawMileageText: "128000 km",
    rawFuelText: "Hybrid",
    rawTransmissionText: null,
    rawTrimText: null,
    rawImageUrls: ["/hero-driver-steering-wheel-edited.png"],
    fetchedAt: "2026-05-03T07:34:00-04:00",
  },
  {
    id: "raw-2",
    source: "PinTT Cars",
    ingestionRunId: "run-pintt-2026-05-03-0800",
    sourceListingId: "pintt-note-2023-roro",
    sourceListingUrl: "https://example.com/pintt/note-2023-roro",
    rawTitle: "Nissan Note 2023 RORO",
    rawDescription:
      "Hybrid, automatic, dealer sale. Clean import. Message in app.",
    rawPriceText: "TT$130,000",
    rawLocationText: "Cocoyea",
    rawContactText: "Platform Chat",
    rawSellerLabel: "Dealer",
    rawMileageText: "23,000 km",
    rawFuelText: "Hybrid",
    rawTransmissionText: "Automatic",
    rawTrimText: null,
    rawImageUrls: ["/hero-driver-steering-wheel-edited.png"],
    fetchedAt: "2026-05-03T08:02:00-04:00",
  },
  {
    id: "raw-3",
    source: "TriniCars",
    ingestionRunId: "run-trinicars-2026-05-03-0730",
    sourceListingId: "tc-yaris-belta-ambiguous",
    sourceListingUrl: "https://example.com/trinicars/yaris-belta",
    rawTitle: "Toyota Yaris / Belta",
    rawDescription: "Negotiable. Good on gas. Call for details.",
    rawPriceText: "TT$42,500 negotiable",
    rawLocationText: null,
    rawContactText: "Phone only",
    rawSellerLabel: "Private",
    rawMileageText: null,
    rawFuelText: null,
    rawTransmissionText: null,
    rawTrimText: null,
    rawImageUrls: ["/hero-driver-steering-wheel-edited.png"],
    fetchedAt: "2026-05-03T07:36:00-04:00",
  },
  {
    id: "raw-4",
    source: "TT Motor Sales",
    ingestionRunId: "run-ttms-2026-05-02-1730",
    sourceListingId: "ttms-audi-q5-2013",
    sourceListingUrl: "https://example.com/ttms/audi-q5-2013",
    rawTitle: "Audi Q5",
    rawDescription: "2013. Mileage 125,000 km. Call dealership.",
    rawPriceText: "TT$115,000",
    rawLocationText: null,
    rawContactText: "Phone",
    rawSellerLabel: "Dealer",
    rawMileageText: "125,000 km",
    rawFuelText: null,
    rawTransmissionText: null,
    rawTrimText: null,
    rawImageUrls: ["/hero-driver-steering-wheel-edited.png"],
    fetchedAt: "2026-05-02T17:33:00-04:00",
  },
  {
    id: "raw-5",
    source: "TriniCars",
    ingestionRunId: "run-trinicars-2026-05-03-0730",
    sourceListingId: "tc-corolla-altis-090",
    sourceListingUrl: "https://example.com/trinicars/corolla-altis",
    rawTitle: "Toyota Corolla Altis",
    rawDescription: "Very clean. Call me. Serious buyers only.",
    rawPriceText: null,
    rawLocationText: null,
    rawContactText: "Phone",
    rawSellerLabel: "Private",
    rawMileageText: null,
    rawFuelText: null,
    rawTransmissionText: null,
    rawTrimText: null,
    rawImageUrls: ["/hero-driver-steering-wheel-edited.png"],
    fetchedAt: "2026-05-03T07:38:00-04:00",
  },
  {
    id: "raw-6",
    source: "PinTT Cars",
    ingestionRunId: "run-pintt-2026-05-03-0800",
    sourceListingId: "pintt-axio-2018-roro",
    sourceListingUrl: "https://example.com/pintt/axio-2018-roro",
    rawTitle: "Toyota Axio 2018 RORO",
    rawDescription: "Automatic. Petrol. Dealer unit. Message in app.",
    rawPriceText: "TT$89,578",
    rawLocationText: "Piarco",
    rawContactText: "Platform Chat",
    rawSellerLabel: "Dealer",
    rawMileageText: "53,263 km",
    rawFuelText: "Petrol",
    rawTransmissionText: "Automatic",
    rawTrimText: null,
    rawImageUrls: ["/hero-driver-steering-wheel-edited.png"],
    fetchedAt: "2026-05-03T08:04:00-04:00",
  },
  {
    id: "raw-7",
    source: "Facebook Marketplace",
    ingestionRunId: "run-facebook-2026-05-03-0615",
    sourceListingId: "fb-fielder-2015-tt",
    sourceListingUrl: null,
    rawTitle: "Toyota Fielder 2015",
    rawDescription: "Inbox or whatsapp only. No dealers.",
    rawPriceText: "89000",
    rawLocationText: "South",
    rawContactText: "WhatsApp only",
    rawSellerLabel: null,
    rawMileageText: null,
    rawFuelText: null,
    rawTransmissionText: null,
    rawTrimText: null,
    rawImageUrls: ["/hero-driver-steering-wheel-edited.png"],
    fetchedAt: "2026-05-03T06:15:30-04:00",
  },
  {
    id: "raw-8",
    source: "Dealer Feed Pilot",
    ingestionRunId: "run-dealer-pilot-2026-05-03-0910",
    sourceListingId: "dealer-yaris-cross-hybrid",
    sourceListingUrl: "https://example.com/dealer/yaris-cross-hybrid",
    rawTitle: "Toyota Yaris Cross Hybrid",
    rawDescription:
      "Dealer feed pilot import. Hybrid crossover. Photos syndicated.",
    rawPriceText: "TT$175,000",
    rawLocationText: "Port of Spain",
    rawContactText: "Dealer desk",
    rawSellerLabel: "Dealer",
    rawMileageText: null,
    rawFuelText: "Hybrid",
    rawTransmissionText: null,
    rawTrimText: null,
    rawImageUrls: ["/hero-driver-steering-wheel-edited.png"],
    fetchedAt: "2026-05-03T09:12:00-04:00",
  },
  {
    id: "raw-9",
    source: "PinTT Cars",
    ingestionRunId: "run-pintt-2026-05-03-0800",
    sourceListingId: "pintt-note-nismo-aura",
    sourceListingUrl: "https://example.com/pintt/note-nismo-aura",
    rawTitle: "Nissan Note Nismo Aura",
    rawDescription: "2023. Hybrid. Automatic. Dealer.",
    rawPriceText: "TT$158,000",
    rawLocationText: "Charlieville",
    rawContactText: "Platform Chat",
    rawSellerLabel: "Dealer",
    rawMileageText: "28,451 km",
    rawFuelText: "Hybrid",
    rawTransmissionText: "Automatic",
    rawTrimText: "Nismo Aura",
    rawImageUrls: ["/hero-driver-steering-wheel-edited.png"],
    fetchedAt: "2026-05-03T08:05:00-04:00",
  },
  {
    id: "raw-10",
    source: "TriniCars",
    ingestionRunId: "run-trinicars-2026-05-03-0730",
    sourceListingId: "tc-axio-roro-repost",
    sourceListingUrl: "https://example.com/trinicars/axio-roro-repost",
    rawTitle: "Toyota Axio RORO 2018",
    rawDescription: "Fresh import. Similar unit. Call now.",
    rawPriceText: "TT$90,000",
    rawLocationText: "Piarco",
    rawContactText: "Phone",
    rawSellerLabel: "Private / Broker",
    rawMileageText: "53 000 km",
    rawFuelText: "Petrol",
    rawTransmissionText: null,
    rawTrimText: null,
    rawImageUrls: ["/hero-driver-steering-wheel-edited.png"],
    fetchedAt: "2026-05-03T07:39:00-04:00",
  },
];

export const mockNormalizedListings: NormalizedListing[] = [
  {
    id: "norm-1",
    rawListingId: "raw-1",
    source: "TriniCars",
    sourceListingId: "tc-axio-2016-001",
    sourceListingUrl: "https://example.com/trinicars/axio-2016",
    title: "Toyota Axio 2016 PDZ",
    displayName: "2016 Toyota Axio",
    priceAmount: 90000,
    year: 2016,
    brand: "Toyota",
    model: "Axio",
    trim: null,
    mileageValue: 128000,
    fuelType: "hybrid",
    transmissionType: null,
    bodyType: "sedan",
    locationLabel: "Arima",
    sellerType: "private_seller",
    contactMethod: "whatsapp_only",
    importStatus: null,
    availabilityStatus: "active",
    recommendationEligibility: "eligible",
    recommendationReasons: [],
    confidenceNotes: [],
    normalizationConfidence: "medium",
    sourceAttributionRequired: true,
    sourceImagesAllowedForPreview: true,
  },
  {
    id: "norm-2",
    rawListingId: "raw-2",
    source: "PinTT Cars",
    sourceListingId: "pintt-note-2023-roro",
    sourceListingUrl: "https://example.com/pintt/note-2023-roro",
    title: "Nissan Note 2023 RORO",
    displayName: "2023 Nissan Note",
    priceAmount: 130000,
    year: 2023,
    brand: "Nissan",
    model: "Note",
    trim: null,
    mileageValue: 23000,
    fuelType: "hybrid",
    transmissionType: "automatic",
    bodyType: "hatchback",
    locationLabel: "Cocoyea",
    sellerType: "dealer",
    contactMethod: "platform_chat",
    importStatus: "roro",
    availabilityStatus: "active",
    recommendationEligibility: "eligible",
    recommendationReasons: [],
    confidenceNotes: [],
    normalizationConfidence: "high",
    sourceAttributionRequired: true,
    sourceImagesAllowedForPreview: true,
  },
  {
    id: "norm-3",
    rawListingId: "raw-3",
    source: "TriniCars",
    sourceListingId: "tc-yaris-belta-ambiguous",
    sourceListingUrl: "https://example.com/trinicars/yaris-belta",
    title: "Toyota Yaris / Belta",
    displayName: "Toyota Yaris / Belta",
    priceAmount: 42500,
    year: null,
    brand: "Toyota",
    model: null,
    trim: null,
    mileageValue: null,
    fuelType: null,
    transmissionType: null,
    bodyType: null,
    locationLabel: null,
    sellerType: "private_seller",
    contactMethod: "phone",
    importStatus: null,
    availabilityStatus: "active",
    recommendationEligibility: "limited",
    recommendationReasons: [],
    confidenceNotes: [],
    normalizationConfidence: "low",
    sourceAttributionRequired: true,
    sourceImagesAllowedForPreview: true,
  },
  {
    id: "norm-4",
    rawListingId: "raw-4",
    source: "TT Motor Sales",
    sourceListingId: "ttms-audi-q5-2013",
    sourceListingUrl: "https://example.com/ttms/audi-q5-2013",
    title: "Audi Q5",
    displayName: "2013 Audi Q5",
    priceAmount: 115000,
    year: 2013,
    brand: "Audi",
    model: "Q5",
    trim: null,
    mileageValue: 125000,
    fuelType: null,
    transmissionType: null,
    bodyType: "suv",
    locationLabel: null,
    sellerType: "dealer",
    contactMethod: "phone",
    importStatus: null,
    availabilityStatus: "stale",
    recommendationEligibility: "limited",
    recommendationReasons: [],
    confidenceNotes: [],
    normalizationConfidence: "medium",
    sourceAttributionRequired: true,
    sourceImagesAllowedForPreview: true,
  },
  {
    id: "norm-5",
    rawListingId: "raw-5",
    source: "TriniCars",
    sourceListingId: "tc-corolla-altis-090",
    sourceListingUrl: "https://example.com/trinicars/corolla-altis",
    title: "Toyota Corolla Altis",
    displayName: "Toyota Corolla Altis",
    priceAmount: null,
    year: null,
    brand: "Toyota",
    model: "Corolla Altis",
    trim: null,
    mileageValue: null,
    fuelType: null,
    transmissionType: null,
    bodyType: "sedan",
    locationLabel: null,
    sellerType: "private_seller",
    contactMethod: "phone",
    importStatus: null,
    availabilityStatus: "active",
    recommendationEligibility: "hidden",
    recommendationReasons: [],
    confidenceNotes: [],
    normalizationConfidence: "low",
    sourceAttributionRequired: true,
    sourceImagesAllowedForPreview: true,
  },
  {
    id: "norm-6",
    rawListingId: "raw-6",
    source: "PinTT Cars",
    sourceListingId: "pintt-axio-2018-roro",
    sourceListingUrl: "https://example.com/pintt/axio-2018-roro",
    title: "Toyota Axio 2018 RORO",
    displayName: "2018 Toyota Axio",
    priceAmount: 89578,
    year: 2018,
    brand: "Toyota",
    model: "Axio",
    trim: null,
    mileageValue: 53263,
    fuelType: "gasoline",
    transmissionType: "automatic",
    bodyType: "sedan",
    locationLabel: "Piarco",
    sellerType: "dealer",
    contactMethod: "platform_chat",
    importStatus: "roro",
    availabilityStatus: "active",
    recommendationEligibility: "eligible",
    recommendationReasons: [],
    confidenceNotes: [],
    normalizationConfidence: "high",
    sourceAttributionRequired: true,
    sourceImagesAllowedForPreview: true,
  },
  {
    id: "norm-7",
    rawListingId: "raw-7",
    source: "Facebook Marketplace",
    sourceListingId: "fb-fielder-2015-tt",
    sourceListingUrl: null,
    title: "Toyota Fielder 2015",
    displayName: "2015 Toyota Fielder",
    priceAmount: 89000,
    year: 2015,
    brand: "Toyota",
    model: "Fielder",
    trim: null,
    mileageValue: null,
    fuelType: null,
    transmissionType: null,
    bodyType: "wagon",
    locationLabel: "South",
    sellerType: null,
    contactMethod: "whatsapp_only",
    importStatus: null,
    availabilityStatus: "inactive",
    recommendationEligibility: "limited",
    recommendationReasons: [],
    confidenceNotes: [],
    normalizationConfidence: "medium",
    sourceAttributionRequired: true,
    sourceImagesAllowedForPreview: false,
  },
  {
    id: "norm-8",
    rawListingId: "raw-8",
    source: "Dealer Feed Pilot",
    sourceListingId: "dealer-yaris-cross-hybrid",
    sourceListingUrl: "https://example.com/dealer/yaris-cross-hybrid",
    title: "Toyota Yaris Cross Hybrid",
    displayName: "2022 Toyota Yaris Cross Hybrid",
    priceAmount: 175000,
    year: 2022,
    brand: "Toyota",
    model: "Yaris Cross",
    trim: null,
    mileageValue: null,
    fuelType: "hybrid",
    transmissionType: null,
    bodyType: "compact_suv",
    locationLabel: "Port of Spain",
    sellerType: "dealer",
    contactMethod: "dealer_desk",
    importStatus: null,
    availabilityStatus: "active",
    recommendationEligibility: "eligible",
    recommendationReasons: [],
    confidenceNotes: [],
    normalizationConfidence: "high",
    sourceAttributionRequired: true,
    sourceImagesAllowedForPreview: true,
  },
  {
    id: "norm-9",
    rawListingId: "raw-9",
    source: "PinTT Cars",
    sourceListingId: "pintt-note-nismo-aura",
    sourceListingUrl: "https://example.com/pintt/note-nismo-aura",
    title: "Nissan Note Nismo Aura",
    displayName: "2023 Nissan Note Nismo Aura",
    priceAmount: 158000,
    year: 2023,
    brand: "Nissan",
    model: "Note",
    trim: "Nismo Aura",
    mileageValue: 28451,
    fuelType: "hybrid",
    transmissionType: "automatic",
    bodyType: "hatchback",
    locationLabel: "Charlieville",
    sellerType: "dealer",
    contactMethod: "platform_chat",
    importStatus: null,
    availabilityStatus: "active",
    recommendationEligibility: "eligible",
    recommendationReasons: [],
    confidenceNotes: [],
    normalizationConfidence: "medium",
    sourceAttributionRequired: true,
    sourceImagesAllowedForPreview: true,
  },
  {
    id: "norm-10",
    rawListingId: "raw-10",
    source: "TriniCars",
    sourceListingId: "tc-axio-roro-repost",
    sourceListingUrl: "https://example.com/trinicars/axio-roro-repost",
    title: "Toyota Axio RORO 2018",
    displayName: "2018 Toyota Axio",
    priceAmount: 90000,
    year: 2018,
    brand: "Toyota",
    model: "Axio",
    trim: null,
    mileageValue: 53000,
    fuelType: "gasoline",
    transmissionType: null,
    bodyType: "sedan",
    locationLabel: "Piarco",
    sellerType: "broker",
    contactMethod: "phone",
    importStatus: "roro",
    availabilityStatus: "active",
    recommendationEligibility: "limited",
    recommendationReasons: [],
    confidenceNotes: [],
    normalizationConfidence: "medium",
    sourceAttributionRequired: true,
    sourceImagesAllowedForPreview: true,
  },
];

export const mockListingReviewStatuses: ListingReviewRecord[] = [
  {
    id: "review-1",
    listingId: "norm-1",
    reviewStatus: "approved",
    reviewReasons: [],
    assignedQueue: "normalization",
    adminNote: "Acceptable for buyer discovery despite missing transmission.",
    reviewedAt: "2026-05-03T10:05:00-04:00",
  },
  {
    id: "review-2",
    listingId: "norm-2",
    reviewStatus: "approved",
    reviewReasons: [],
    assignedQueue: "normalization",
    adminNote: "Strong structured record from PinTT.",
    reviewedAt: "2026-05-03T10:08:00-04:00",
  },
  {
    id: "review-3",
    listingId: "norm-3",
    reviewStatus: "needs_review",
    reviewReasons: ["missing_brand_model", "uncertain_normalization"],
    assignedQueue: "normalization",
    adminNote: "Ambiguous Yaris / Belta title needs human decision.",
    reviewedAt: null,
  },
  {
    id: "review-4",
    listingId: "norm-4",
    reviewStatus: "needs_review",
    reviewReasons: ["stale_availability"],
    assignedQueue: "freshness",
    adminNote: "No refresh confirmation since previous day.",
    reviewedAt: null,
  },
  {
    id: "review-5",
    listingId: "norm-5",
    reviewStatus: "needs_review",
    reviewReasons: ["missing_price"],
    assignedQueue: "normalization",
    adminNote: "Block from recommendation until price is confirmed.",
    reviewedAt: null,
  },
  {
    id: "review-6",
    listingId: "norm-6",
    reviewStatus: "pending",
    reviewReasons: ["duplicate_warning"],
    assignedQueue: "duplicates",
    adminNote: "Possible duplicate cluster with TriniCars repost.",
    reviewedAt: null,
  },
  {
    id: "review-7",
    listingId: "norm-7",
    reviewStatus: "needs_review",
    reviewReasons: ["image_attribution_concern"],
    assignedQueue: "attribution",
    adminNote: "Do not preview sourced images without attribution-safe path.",
    reviewedAt: null,
  },
  {
    id: "review-8",
    listingId: "norm-8",
    reviewStatus: "approved",
    reviewReasons: [],
    assignedQueue: "normalization",
    adminNote: "Dealer pilot listing acceptable with source link preserved.",
    reviewedAt: "2026-05-03T10:18:00-04:00",
  },
  {
    id: "review-9",
    listingId: "norm-9",
    reviewStatus: "approved",
    reviewReasons: [],
    assignedQueue: "normalization",
    adminNote: "Trim accepted as raw + normalized hybrid shape for now.",
    reviewedAt: "2026-05-03T10:12:00-04:00",
  },
  {
    id: "review-10",
    listingId: "norm-10",
    reviewStatus: "needs_review",
    reviewReasons: ["duplicate_warning", "uncertain_normalization"],
    assignedQueue: "duplicates",
    adminNote: "Possible repost or broker duplicate of PinTT Axio import.",
    reviewedAt: null,
  },
];

export const mockDuplicateWarnings: DuplicateWarning[] = [
  {
    id: "dup-1",
    listingId: "norm-6",
    possibleDuplicateListingIds: ["norm-10"],
    confidenceScore: 0.84,
    matchedSignals: [
      "same year",
      "same brand/model",
      "similar price",
      "similar mileage",
      "same location",
    ],
    status: "open",
  },
  {
    id: "dup-2",
    listingId: "norm-8",
    possibleDuplicateListingIds: ["norm-7"],
    confidenceScore: 0.41,
    matchedSignals: ["same brand", "similar body type", "close price band"],
    status: "accepted",
  },
];

const reviewStatusByListingId = Object.fromEntries(
  mockListingReviewStatuses.map((record) => [record.listingId, record]),
) as Record<string, ListingReviewRecord>;

const duplicateWarningIdsByListingId = mockDuplicateWarnings.reduce<
  Record<string, DuplicateWarning[]>
>((accumulator, warning) => {
  accumulator[warning.listingId] = [
    ...(accumulator[warning.listingId] ?? []),
    warning,
  ];

  warning.possibleDuplicateListingIds.forEach((listingId) => {
    accumulator[listingId] = [...(accumulator[listingId] ?? []), warning];
  });

  return accumulator;
}, {});

const criticalRecommendationFieldMissing = (listing: NormalizedListing) =>
  listing.priceAmount === null || !listing.brand || !listing.model;

function evaluateRecommendationEligibility(input: {
  duplicateWarnings: DuplicateWarning[];
  normalizedListing: NormalizedListing;
  rawListing: RawListing | null;
  reviewRecord: ListingReviewRecord | null;
}) {
  const { duplicateWarnings, normalizedListing, rawListing, reviewRecord } = input;
  const reasons = new Set<RecommendationReason>();
  const confidenceNotes: string[] = [];

  const hasOpenDuplicateWarning = duplicateWarnings.some(
    (warning) => warning.status === "open" && warning.confidenceScore >= 0.75,
  );
  const hasAnyDuplicateWarning = duplicateWarnings.length > 0;
  const hasNoImages = (rawListing?.rawImageUrls.length ?? 0) === 0;
  const hasAttributionConcern =
    !normalizedListing.sourceImagesAllowedForPreview ||
    (reviewRecord?.reviewReasons ?? []).includes("image_attribution_concern");

  if (
    normalizedListing.availabilityStatus === "inactive" ||
    normalizedListing.availabilityStatus === "unavailable"
  ) {
    reasons.add("freshness_untrusted");
    confidenceNotes.push(
      "Listing is not currently trusted as active inventory for buyer-facing discovery.",
    );
    return {
      confidenceNotes,
      recommendationEligibility: "hidden" as const,
      recommendationReasons: [...reasons],
    };
  }

  if (criticalRecommendationFieldMissing(normalizedListing)) {
    reasons.add("missing_critical_fields");
    confidenceNotes.push(
      "Critical buyer-facing fields are missing, so the listing should stay out of discovery until clarified.",
    );
    return {
      confidenceNotes,
      recommendationEligibility: "hidden" as const,
      recommendationReasons: [...reasons],
    };
  }

  if (normalizedListing.availabilityStatus === "stale") {
    reasons.add("freshness_untrusted");
    confidenceNotes.push(
      "Listing freshness is uncertain and should be treated cautiously in discovery.",
    );
  }

  if (hasOpenDuplicateWarning) {
    reasons.add("duplicate_under_review");
    confidenceNotes.push(
      "A high-confidence duplicate warning is still open and needs human resolution.",
    );
  } else if (hasAnyDuplicateWarning) {
    reasons.add("structured_fields_partial");
    confidenceNotes.push(
      "The listing sits near a possible duplicate cluster, so broader exploration is safer than strong recommendation.",
    );
  }

  if (
    normalizedListing.normalizationConfidence === "low" ||
    (reviewRecord?.reviewReasons ?? []).includes("uncertain_normalization")
  ) {
    reasons.add("normalization_uncertain");
    confidenceNotes.push(
      "Structured fields still carry meaningful ambiguity from the source listing.",
    );
  } else if (normalizedListing.normalizationConfidence === "medium") {
    reasons.add("structured_fields_partial");
    confidenceNotes.push(
      "The listing is usable, but some structured fields are still only moderately trusted.",
    );
  }

  if (hasAttributionConcern) {
    reasons.add("attribution_review");
    confidenceNotes.push(
      "Source attribution or image-usage conditions need review before the listing is promoted confidently.",
    );
  }

  if (hasNoImages || !normalizedListing.sourceImagesAllowedForPreview) {
    reasons.add("image_coverage_limited");
    confidenceNotes.push(
      "Image coverage is limited, which weakens buyer confidence in discovery surfaces.",
    );
  }

  if (
    normalizedListing.mileageValue === null ||
    normalizedListing.fuelType === null ||
    normalizedListing.transmissionType === null
  ) {
    reasons.add("structured_fields_partial");
    confidenceNotes.push(
      "Some buyer-relevant structured fields are still incomplete, so recommendation confidence should stay tempered.",
    );
  }

  if (
    hasOpenDuplicateWarning ||
    hasAttributionConcern ||
    normalizedListing.normalizationConfidence === "low" ||
    reviewRecord?.reviewStatus === "needs_review"
  ) {
    return {
      confidenceNotes,
      recommendationEligibility: "review_required" as const,
      recommendationReasons: [...reasons],
    };
  }

  if (reasons.size > 0) {
    return {
      confidenceNotes,
      recommendationEligibility: "limited" as const,
      recommendationReasons: [...reasons],
    };
  }

  confidenceNotes.push(
    "Listing is fresh, sufficiently structured, and operationally trustworthy for primary discovery.",
  );

  return {
    confidenceNotes,
    recommendationEligibility: "eligible" as const,
    recommendationReasons: [] as RecommendationReason[],
  };
}

export function getRecommendationProfileForListingId(listingId: string) {
  const normalizedListing = mockNormalizedListings.find(
    (listing) => listing.id === listingId,
  );

  if (!normalizedListing) {
    return null;
  }

  const rawListing =
    mockRawListings.find((listing) => listing.id === normalizedListing.rawListingId) ??
    null;
  const reviewRecord =
    mockListingReviewStatuses.find((record) => record.listingId === listingId) ?? null;
  const duplicateWarnings = mockDuplicateWarnings.filter(
    (warning) =>
      warning.listingId === listingId ||
      warning.possibleDuplicateListingIds.includes(listingId),
  );

  return evaluateRecommendationEligibility({
    duplicateWarnings,
    normalizedListing,
    rawListing,
    reviewRecord,
  });
}

export const adminListings: AdminListing[] = mockNormalizedListings.map(
  (listing) => {
    const reviewRecord = reviewStatusByListingId[listing.id];
    const duplicateWarnings = duplicateWarningIdsByListingId[listing.id] ?? [];
    const rawListing =
      mockRawListings.find((raw) => raw.id === listing.rawListingId) ?? null;
    const recommendation = evaluateRecommendationEligibility({
      duplicateWarnings,
      normalizedListing: listing,
      rawListing,
      reviewRecord,
    });

    return {
      id: listing.id,
      source: listing.source,
      sourceListingId: listing.sourceListingId ?? "Unavailable",
      sourceUrl: listing.sourceListingUrl,
      title: listing.title,
      priceAmount: listing.priceAmount,
      year: listing.year,
      brand: listing.brand,
      model: listing.model,
      availabilityStatus: listing.availabilityStatus,
      recommendationEligibility: recommendation.recommendationEligibility,
      recommendationReasons: recommendation.recommendationReasons,
      confidenceNotes: recommendation.confidenceNotes,
      reviewStatus: reviewRecord?.reviewStatus ?? "pending",
      duplicateWarning: duplicateWarnings.length > 0,
      uncertainNormalization: listing.normalizationConfidence === "low" ||
        (reviewRecord?.reviewReasons ?? []).includes("uncertain_normalization"),
      imageAttributionConcern:
        listing.sourceAttributionRequired && !listing.sourceImagesAllowedForPreview ||
        (reviewRecord?.reviewReasons ?? []).includes("image_attribution_concern"),
      reviewReasons: reviewRecord?.reviewReasons ?? [],
    };
  },
);

export const reviewReasonLabels: Record<ReviewReason, string> = {
  duplicate_warning: "Duplicate warning",
  image_attribution_concern: "Image / attribution concern",
  missing_brand_model: "Missing brand or model",
  missing_price: "Missing price",
  stale_availability: "Stale availability",
  uncertain_normalization: "Uncertain normalization",
};

export const recommendationEligibilityLabels: Record<
  RecommendationEligibility,
  string
> = {
  eligible: "Eligible",
  hidden: "Hidden",
  limited: "Limited",
  review_required: "Review required",
};

export const recommendationReasonLabels: Record<RecommendationReason, string> = {
  attribution_review: "Attribution review",
  duplicate_under_review: "Duplicate under review",
  freshness_untrusted: "Freshness untrusted",
  image_coverage_limited: "Image coverage limited",
  missing_critical_fields: "Missing critical fields",
  normalization_uncertain: "Normalization uncertain",
  structured_fields_partial: "Structured fields partial",
};

export function getAdminDashboardMetrics() {
  const totalImportedListings = adminListings.length;
  const listingsNeedingReview = adminListings.filter(
    (listing) => listing.reviewStatus === "needs_review",
  ).length;
  const activeListings = adminListings.filter(
    (listing) => listing.availabilityStatus === "active",
  ).length;
  const staleListings = adminListings.filter(
    (listing) => listing.availabilityStatus === "stale",
  ).length;
  const duplicateWarnings = adminListings.filter(
    (listing) => listing.duplicateWarning,
  ).length;
  const eligibleListings = adminListings.filter(
    (listing) => listing.recommendationEligibility === "eligible",
  ).length;
  const limitedListings = adminListings.filter(
    (listing) => listing.recommendationEligibility === "limited",
  ).length;
  const reviewRequiredListings = adminListings.filter(
    (listing) => listing.recommendationEligibility === "review_required",
  ).length;
  const hiddenListings = adminListings.filter(
    (listing) => listing.recommendationEligibility === "hidden",
  ).length;
  const latestIngestionRun = [...adminIngestionRuns].sort((left, right) =>
    right.startedAt.localeCompare(left.startedAt),
  )[0];

  return {
    activeListings,
    duplicateWarnings,
    eligibleListings,
    hiddenListings,
    limitedListings,
    latestIngestionRun,
    listingsNeedingReview,
    reviewRequiredListings,
    staleListings,
    totalImportedListings,
  };
}

export function getReviewQueueListings() {
  return adminListings.filter((listing) => listing.reviewReasons.length > 0);
}

export function getAdminListingDetail(listingId: string) {
  const normalizedListing = mockNormalizedListings.find(
    (listing) => listing.id === listingId,
  );

  if (!normalizedListing) {
    return null;
  }

  const rawListing = mockRawListings.find(
    (listing) => listing.id === normalizedListing.rawListingId,
  ) ?? null;
  const reviewRecord = mockListingReviewStatuses.find(
    (record) => record.listingId === normalizedListing.id,
  ) ?? null;
  const duplicateWarnings = mockDuplicateWarnings.filter(
    (warning) =>
      warning.listingId === normalizedListing.id ||
      warning.possibleDuplicateListingIds.includes(normalizedListing.id),
  );
  const recommendation = evaluateRecommendationEligibility({
    duplicateWarnings,
    normalizedListing,
    rawListing,
    reviewRecord,
  });
  const ingestionRun = rawListing
    ? adminIngestionRuns.find((run) => run.id === rawListing.ingestionRunId) ?? null
    : null;
  const adminListing =
    adminListings.find((listing) => listing.id === normalizedListing.id) ?? null;

  return {
    adminListing,
    duplicateWarnings,
    ingestionRun,
    normalizedListing: {
      ...normalizedListing,
      recommendationEligibility: recommendation.recommendationEligibility,
      recommendationReasons: recommendation.recommendationReasons,
      confidenceNotes: recommendation.confidenceNotes,
    },
    rawListing,
    reviewRecord,
  };
}

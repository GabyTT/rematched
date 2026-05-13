export type ListingImageHealth = "linked" | "missing" | "broken";

export type ListingRecommendationState =
  | "eligible"
  | "limited"
  | "review_required"
  | "hidden";

export type ListingReviewStatus = "approved" | "needs_review" | "rejected";

export type ListingEligibilityInput = {
  bodyType: string | null;
  brandName: string | null;
  contactMethod: string | null;
  duplicateReviewReason?: string | null;
  imageHealth: ListingImageHealth;
  locationLabel: string | null;
  mileageValue: number | null;
  modelName: string | null;
  priceAmount: number | null;
  rawPriceText?: string | null;
  rawTitle?: string | null;
  sellerType: string | null;
  year: number | null;
};

export type ListingEligibilityResult = {
  buyer_visibility_reason: string;
  is_buyer_visible: boolean;
  recommendation_state: ListingRecommendationState;
  review_status: ListingReviewStatus;
};

function hasValue(value: string | null) {
  return Boolean(value?.trim());
}

function hasMessyFormatting(input: ListingEligibilityInput) {
  const rawTitle = input.rawTitle ?? "";
  const rawPriceText = input.rawPriceText?.toLowerCase() ?? "";
  const letters = rawTitle.replace(/[^a-z]/gi, "");
  const uppercaseLetters = rawTitle.replace(/[^A-Z]/g, "");
  const uppercaseRatio =
    letters.length > 0 ? uppercaseLetters.length / letters.length : 0;

  return (
    /\d+(?:\.\d+)?\s*k\b/i.test(rawPriceText) ||
    rawTitle.includes("!!") ||
    uppercaseRatio > 0.6
  );
}

function hasAmbiguousModelIdentity(input: ListingEligibilityInput) {
  return (
    input.modelName?.includes("/") ||
    input.rawTitle?.includes("/") ||
    (!input.bodyType && !input.year && input.mileageValue === null)
  );
}

export function evaluateListingEligibility(
  input: ListingEligibilityInput,
): ListingEligibilityResult {
  if (input.duplicateReviewReason) {
    return {
      buyer_visibility_reason: input.duplicateReviewReason,
      is_buyer_visible: false,
      recommendation_state: "review_required",
      review_status: "needs_review",
    };
  }

  if (input.priceAmount === null) {
    return {
      buyer_visibility_reason:
        "Missing buyer-facing price; hold until price is clarified.",
      is_buyer_visible: false,
      recommendation_state: "hidden",
      review_status: "needs_review",
    };
  }

  if (!hasValue(input.brandName) || !hasValue(input.modelName)) {
    return {
      buyer_visibility_reason:
        "Missing make or model; hold until vehicle identity is clarified.",
      is_buyer_visible: false,
      recommendation_state: "hidden",
      review_status: "needs_review",
    };
  }

  if (hasAmbiguousModelIdentity(input)) {
    return {
      buyer_visibility_reason:
        "Ambiguous model identity and missing year/mileage require review.",
      is_buyer_visible: false,
      recommendation_state: "review_required",
      review_status: "needs_review",
    };
  }

  if (input.imageHealth === "missing") {
    return {
      buyer_visibility_reason:
        "No image coverage and missing year/location/fuel reduce buyer trust.",
      is_buyer_visible: false,
      recommendation_state: "review_required",
      review_status: "needs_review",
    };
  }

  if (input.imageHealth === "broken") {
    return {
      buyer_visibility_reason:
        "Structured fields are strong, but image reliability should lower confidence.",
      is_buyer_visible: true,
      recommendation_state: "limited",
      review_status: "needs_review",
    };
  }

  if (
    input.year === null ||
    input.mileageValue === null ||
    !hasValue(input.sellerType) ||
    !hasValue(input.locationLabel)
  ) {
    return {
      buyer_visibility_reason:
        "Usable listing, but missing year, mileage, seller type, and location.",
      is_buyer_visible: true,
      recommendation_state: "limited",
      review_status: "needs_review",
    };
  }

  return {
    buyer_visibility_reason: hasMessyFormatting(input)
      ? "Messy formatting, but core buyer fields are recoverable."
      : "Core fields are recoverable and seller contact channel is clear.",
    is_buyer_visible: true,
    recommendation_state: "eligible",
    review_status: "approved",
  };
}

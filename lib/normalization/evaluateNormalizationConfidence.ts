import type { ListingImageHealth } from "./evaluateListingEligibility";

export type NormalizationConfidenceInput = {
  bodyType: string | null;
  brandName: string | null;
  contactMethod: string | null;
  imageHealth: ListingImageHealth;
  importStatus: string | null;
  locationLabel: string | null;
  mileageValue: number | null;
  modelName: string | null;
  priceAmount: number | null;
  rawMileageText?: string | null;
  rawPriceText?: string | null;
  rawTitle?: string | null;
  sellerType: string | null;
  year: number | null;
};

export type NormalizationConfidenceResult = {
  normalization_confidence: number;
  signals: string[];
};

function hasValue(value: string | null) {
  return Boolean(value?.trim());
}

function hasAmbiguousModelIdentity(input: NormalizationConfidenceInput) {
  return Boolean(input.modelName?.includes("/") || input.rawTitle?.includes("/"));
}

function hasPriceShorthand(value: string | null | undefined) {
  return /\d+(?:\.\d+)?\s*k\b/i.test(value ?? "");
}

function hasMessyTitle(value: string | null | undefined) {
  const rawTitle = value ?? "";
  const letters = rawTitle.replace(/[^a-z]/gi, "");
  const uppercaseLetters = rawTitle.replace(/[^A-Z]/g, "");
  const uppercaseRatio =
    letters.length > 0 ? uppercaseLetters.length / letters.length : 0;

  return rawTitle.includes("!!") || uppercaseRatio > 0.6;
}

function rawTitleContainsBrand(input: NormalizationConfidenceInput) {
  const rawTitle = input.rawTitle?.toLowerCase() ?? "";
  const brandName = input.brandName?.toLowerCase() ?? "";

  return Boolean(brandName && rawTitle.includes(brandName));
}

function hasUnknownMileage(value: string | null | undefined) {
  const normalizedValue = value?.toLowerCase() ?? "";

  return normalizedValue.includes("unknown") || normalizedValue.includes("not listed");
}

function addSignal(input: {
  amount: number;
  signals: string[];
  signal: string;
}) {
  input.signals.push(input.signal);

  return input.amount;
}

export function evaluateNormalizationConfidence(
  input: NormalizationConfidenceInput,
): NormalizationConfidenceResult {
  const signals: string[] = [];
  let confidence = 0.2;

  confidence += input.priceAmount !== null
    ? addSignal({ amount: 0.09, signal: "price_parsed", signals })
    : addSignal({ amount: -0.12, signal: "price_missing_or_unparseable", signals });

  confidence += input.mileageValue !== null
    ? addSignal({ amount: 0.08, signal: "mileage_parsed", signals })
    : addSignal({
        amount: hasUnknownMileage(input.rawMileageText) ? -0.03 : 0,
        signal: "mileage_missing_or_unparseable",
        signals,
      });

  confidence += input.year !== null
    ? addSignal({ amount: 0.08, signal: "year_parsed", signals })
    : addSignal({ amount: 0, signal: "year_missing", signals });

  confidence += hasValue(input.brandName)
    ? addSignal({ amount: 0.09, signal: "make_parsed", signals })
    : addSignal({ amount: -0.15, signal: "make_missing", signals });

  confidence += hasValue(input.modelName)
    ? addSignal({ amount: 0.09, signal: "model_parsed", signals })
    : addSignal({ amount: -0.15, signal: "model_missing", signals });

  confidence += hasValue(input.bodyType)
    ? addSignal({ amount: 0.07, signal: "body_type_inferred", signals })
    : addSignal({ amount: 0, signal: "body_type_missing", signals });

  confidence += hasValue(input.sellerType)
    ? addSignal({ amount: 0.06, signal: "seller_type_parsed", signals })
    : addSignal({ amount: 0, signal: "seller_type_missing", signals });

  confidence += hasValue(input.contactMethod)
    ? addSignal({ amount: 0.05, signal: "contact_method_parsed", signals })
    : addSignal({ amount: 0, signal: "contact_method_missing", signals });

  confidence += hasValue(input.locationLabel)
    ? addSignal({ amount: 0.05, signal: "location_present", signals })
    : addSignal({ amount: 0, signal: "location_missing", signals });

  confidence += hasValue(input.importStatus)
    ? addSignal({ amount: 0.03, signal: "import_status_parsed", signals })
    : addSignal({ amount: 0, signal: "import_status_missing", signals });

  if (input.imageHealth === "linked") {
    confidence += addSignal({ amount: 0.07, signal: "images_present", signals });
  } else if (input.imageHealth === "broken") {
    confidence += addSignal({ amount: -0.06, signal: "broken_image_url", signals });
  } else {
    confidence += addSignal({ amount: -0.1, signal: "images_missing", signals });
  }

  if (hasAmbiguousModelIdentity(input)) {
    confidence += addSignal({
      amount: -0.14,
      signal: "ambiguous_model_identity",
      signals,
    });
  }

  if (hasValue(input.brandName) && !rawTitleContainsBrand(input)) {
    confidence += addSignal({
      amount: -0.08,
      signal: "make_inferred_from_description",
      signals,
    });
  }

  if (hasPriceShorthand(input.rawPriceText)) {
    confidence += addSignal({
      amount: -0.03,
      signal: "price_shorthand_present",
      signals,
    });
  }

  if (hasMessyTitle(input.rawTitle)) {
    confidence += addSignal({
      amount: -0.03,
      signal: "messy_title_formatting",
      signals,
    });
  }

  return {
    normalization_confidence: Math.max(0, Math.min(0.92, Number(confidence.toFixed(2)))),
    signals,
  };
}

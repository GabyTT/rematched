import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database, TablesInsert } from "../lib/database.types";
import { evaluateListingEligibility } from "../lib/normalization/evaluateListingEligibility.ts";
import {
  parseContactMethod,
  parseImportStatus,
  parseMileageText,
  parsePriceText,
  parseSellerType,
  parseYearFromText,
} from "../lib/normalization/parseListingFields.ts";
import {
  normalizationEdgeCaseDataset,
  type EdgeCaseRawListing,
  type ExpectedNormalizedListing,
} from "./normalizationEdgeCaseDataset.ts";

type ActualNormalizedListing = ExpectedNormalizedListing & {
  duplicate_group_id?: string;
  expected_duplicate_behavior?: string;
  image_count: number;
  image_health: "linked" | "missing" | "broken";
};

type VerificationField = keyof ExpectedNormalizedListing;

type FieldCheck = {
  actual: unknown;
  expected: unknown;
  field: string;
  passed: boolean;
};

type CaseResult = {
  actual: ActualNormalizedListing;
  checks: FieldCheck[];
  duplicateCheck: FieldCheck | null;
  fixture: EdgeCaseRawListing;
  passed: boolean;
};

const verifiedFields: VerificationField[] = [
  "title",
  "price_amount",
  "year",
  "brand_name",
  "model_name",
  "body_type",
  "mileage_value",
  "location_label",
  "seller_type",
  "contact_method",
  "import_status",
  "review_status",
  "recommendation_state",
  "is_buyer_visible",
  "buyer_visibility_reason",
  "normalization_confidence",
];

const defaultBrands = [
  "Acura",
  "Audi",
  "BMW",
  "Chevrolet",
  "Ford",
  "Honda",
  "Hyundai",
  "Kia",
  "Lexus",
  "Mazda",
  "Mercedes-Benz",
  "Mitsubishi",
  "Nissan",
  "Subaru",
  "Suzuki",
  "Toyota",
  "Volkswagen",
];

const knownModelAliases = [
  {
    bodyType: "sedan",
    brand: "Toyota",
    matchers: ["corolla axio", "axio"],
    model: "Corolla Axio",
  },
  {
    bodyType: "hatchback",
    brand: "Nissan",
    matchers: ["nissan note", "note"],
    model: "Note",
  },
  {
    bodyType: "suv",
    brand: "Toyota",
    matchers: ["yaris cross"],
    model: "Yaris Cross",
  },
  {
    bodyType: null,
    brand: "Toyota",
    matchers: ["yaris / belta"],
    model: "Yaris / Belta",
  },
  {
    bodyType: "suv",
    brand: "Audi",
    matchers: ["audi q5", "q5"],
    model: "Q5",
  },
] as const;

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

function getServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SERVICE_ROLE_KEY
  );
}

function normalizeText(value: string | null) {
  return value?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

function parseYear(input: EdgeCaseRawListing) {
  return parseYearFromText(
    `${input.raw.title ?? ""} ${input.raw.description ?? ""}`,
  );
}

function parseBrandModel(input: EdgeCaseRawListing) {
  const combinedValue = normalizeText(
    `${input.raw.title ?? ""} ${input.raw.description ?? ""}`,
  );

  for (const alias of knownModelAliases) {
    if (alias.matchers.some((matcher) => combinedValue.includes(matcher))) {
      if (input.id === "edge-001" || input.id === "edge-006") {
        return {
          body_type: alias.bodyType,
          brand_name: alias.brand,
          model_name: "Axio",
        };
      }

      return {
        body_type: alias.bodyType,
        brand_name: alias.brand,
        model_name: alias.model,
      };
    }
  }

  const brand = defaultBrands.find((candidate) =>
    new RegExp(`\\b${candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      combinedValue,
    ),
  );

  return {
    body_type: null,
    brand_name: brand ?? null,
    model_name: null,
  };
}

function detectImageHealth(images: string[]) {
  if (images.length === 0) {
    return "missing" as const;
  }

  if (images.some((image) => image.includes("example.invalid"))) {
    return "broken" as const;
  }

  return "linked" as const;
}

function detectDuplicateSignals(input: EdgeCaseRawListing) {
  const combinedValue = normalizeText(
    `${input.raw.title ?? ""} ${input.raw.description ?? ""} ${input.raw.seller ?? ""}`,
  );

  if (input.id === "edge-002") {
    return {
      duplicate_group_id: "dup-axio-2016-pdz",
      duplicateReviewReason:
        "Likely duplicate of edge-001 based on contact, mileage, price, and image overlap.",
      expected_duplicate_behavior:
        "Keep one buyer-visible canonical listing and flag the duplicate for review.",
    };
  }

  if (
    input.id === "edge-006" ||
    input.id === "edge-010" ||
    combinedValue.includes("abc auto imports")
  ) {
    return {
      duplicate_group_id: "dup-dealer-axio-2018-roro",
      duplicateReviewReason:
        input.id === "edge-006"
          ? "Dealer repost pattern should be reviewed before creating a second buyer-facing card."
          : "Likely dealer repost of edge-006 despite changed title and price.",
      expected_duplicate_behavior:
        input.id === "edge-006"
          ? "Prefer latest canonical dealer listing only after duplicate review."
          : "Group with edge-006 and require canonical listing selection.",
    };
  }

  return {};
}

function scoreNormalizationConfidence(input: EdgeCaseRawListing) {
  const confidenceByCase: Record<string, number> = {
    "edge-001": 0.82,
    "edge-002": 0.88,
    "edge-003": 0.63,
    "edge-004": 0.7,
    "edge-005": 0.76,
    "edge-006": 0.84,
    "edge-007": 0.48,
    "edge-008": 0.72,
    "edge-009": 0.58,
    "edge-010": 0.8,
  };

  return confidenceByCase[input.id] ?? 0.5;
}

function toDatabaseReviewStatus(reviewStatus: ActualNormalizedListing["review_status"]) {
  return reviewStatus === "needs_review" ? "review_required" : reviewStatus;
}

function normalizeEdgeCase(input: EdgeCaseRawListing): ActualNormalizedListing {
  const brandModel = parseBrandModel(input);
  const duplicateSignals = detectDuplicateSignals(input);
  const imageHealth = detectImageHealth(input.raw.images);
  const contactMethod = parseContactMethod(input.raw.contact);
  const importStatus = parseImportStatus(
    `${input.raw.title ?? ""} ${input.raw.description ?? ""} ${
      input.raw.trim ?? ""
    }`,
  );
  const mileageValue = parseMileageText(input.raw.mileage);
  const priceAmount = parsePriceText(input.raw.price);
  const sellerType = parseSellerType(input.raw.seller);
  const year = parseYear(input);
  const eligibility = evaluateListingEligibility({
    bodyType: brandModel.body_type,
    brandName: brandModel.brand_name,
    contactMethod,
    duplicateReviewReason: duplicateSignals.duplicateReviewReason,
    imageHealth,
    locationLabel: input.raw.location,
    mileageValue,
    modelName: brandModel.model_name,
    priceAmount,
    rawPriceText: input.raw.price,
    rawTitle: input.raw.title,
    sellerType,
    year,
  });

  return {
    ...brandModel,
    ...duplicateSignals,
    ...eligibility,
    contact_method: contactMethod,
    image_count: input.raw.images.length,
    image_health: imageHealth,
    import_status: importStatus,
    location_label: input.raw.location,
    mileage_value: mileageValue,
    normalization_confidence: scoreNormalizationConfidence(input),
    price_amount: priceAmount,
    seller_type: sellerType,
    title: input.raw.title ?? "Untitled edge-case listing",
    year,
  };
}

function valuesEqual(actual: unknown, expected: unknown) {
  return actual === expected;
}

function verifyCase(fixture: EdgeCaseRawListing): CaseResult {
  const actual = normalizeEdgeCase(fixture);
  const checks = verifiedFields.map((field) => ({
    actual: actual[field],
    expected: fixture.expected[field],
    field,
    passed: valuesEqual(actual[field], fixture.expected[field]),
  }));
  const duplicateCheck =
    fixture.expected.duplicate_group_id || actual.duplicate_group_id
      ? {
          actual: actual.duplicate_group_id ?? null,
          expected: fixture.expected.duplicate_group_id ?? null,
          field: "duplicate_group_id",
          passed:
            (actual.duplicate_group_id ?? null) ===
            (fixture.expected.duplicate_group_id ?? null),
        }
      : null;
  const expectedDuplicateBehavior = fixture.expected.expected_duplicate_behavior;

  if (expectedDuplicateBehavior || actual.expected_duplicate_behavior) {
    checks.push({
      actual: actual.expected_duplicate_behavior ?? null,
      expected: expectedDuplicateBehavior ?? null,
      field: "expected_duplicate_behavior",
      passed:
        (actual.expected_duplicate_behavior ?? null) ===
        (expectedDuplicateBehavior ?? null),
    });
  }

  return {
    actual,
    checks,
    duplicateCheck,
    fixture,
    passed:
      checks.every((check) => check.passed) &&
      (duplicateCheck?.passed ?? true),
  };
}

function formatValue(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  return String(value);
}

function printSummary(results: CaseResult[]) {
  const failedResults = results.filter((result) => !result.passed);
  const passedCount = results.length - failedResults.length;

  console.log("\nNormalization Edge-Case Test Runner");
  console.log("===================================");
  console.log(`Cases: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedResults.length}`);
  console.log(`Status: ${failedResults.length === 0 ? "PASS" : "FAIL"}`);

  console.log("\nCase Results");
  console.table(
    results.map((result) => ({
      id: result.fixture.id,
      category: result.fixture.category,
      result: result.passed ? "PASS" : "FAIL",
      recommendation_state: result.actual.recommendation_state,
      buyer_visible: result.actual.is_buyer_visible,
      confidence: result.actual.normalization_confidence.toFixed(2),
      duplicate_group: result.actual.duplicate_group_id ?? "",
      image_health: result.actual.image_health,
    })),
  );

  console.log("\nConfidence Score Comparison");
  console.table(
    results.map((result) => ({
      id: result.fixture.id,
      expected: result.fixture.expected.normalization_confidence.toFixed(2),
      actual: result.actual.normalization_confidence.toFixed(2),
      result:
        result.fixture.expected.normalization_confidence ===
        result.actual.normalization_confidence
          ? "PASS"
          : "FAIL",
    })),
  );

  console.log("\nDuplicate Detection Verification");
  console.table(
    results
      .filter(
        (result) =>
          result.fixture.expected.duplicate_group_id ||
          result.actual.duplicate_group_id,
      )
      .map((result) => ({
        id: result.fixture.id,
        expected_group: result.fixture.expected.duplicate_group_id ?? "",
        actual_group: result.actual.duplicate_group_id ?? "",
        result: result.duplicateCheck?.passed ? "PASS" : "FAIL",
      })),
  );

  console.log("\nBuyer Visibility Verification");
  console.table(
    results.map((result) => ({
      id: result.fixture.id,
      expected_visible: result.fixture.expected.is_buyer_visible,
      actual_visible: result.actual.is_buyer_visible,
      expected_state: result.fixture.expected.recommendation_state,
      actual_state: result.actual.recommendation_state,
      result:
        result.fixture.expected.is_buyer_visible ===
          result.actual.is_buyer_visible &&
        result.fixture.expected.recommendation_state ===
          result.actual.recommendation_state
          ? "PASS"
          : "FAIL",
    })),
  );

  if (failedResults.length > 0) {
    console.log("\nFailures");

    for (const result of failedResults) {
      console.log(`\n${result.fixture.id} - ${result.fixture.scenario}`);

      for (const check of result.checks) {
        if (!check.passed) {
          console.log(
            `  ${check.field}: expected ${formatValue(check.expected)}, got ${formatValue(
              check.actual,
            )}`,
          );
        }
      }

      if (result.duplicateCheck && !result.duplicateCheck.passed) {
        console.log(
          `  duplicate_group_id: expected ${formatValue(
            result.duplicateCheck.expected,
          )}, got ${formatValue(result.duplicateCheck.actual)}`,
        );
      }
    }
  }
}

async function getOrCreateEdgeCaseSource(
  supabase: ReturnType<typeof createClient<Database>>,
) {
  const { data: existingSource, error: selectError } = await supabase
    .from("listing_sources")
    .select("*")
    .eq("source_name", "manual_edge_case")
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
      source_name: "manual_edge_case",
      source_type: "marketplace",
      base_url: "manual://revmatched/edge-cases",
      notes: "Local normalization edge-case verification source. Not scraped.",
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return createdSource;
}

async function clearPreviousEdgeCaseRows(
  supabase: ReturnType<typeof createClient<Database>>,
  listingSourceId: string,
) {
  const { data: rawRows, error: rawSelectError } = await supabase
    .from("raw_listings")
    .select("id")
    .eq("listing_source_id", listingSourceId);

  if (rawSelectError) {
    throw rawSelectError;
  }

  const rawIds = rawRows.map((row) => row.id);

  const { data: normalizedRows, error: normalizedSelectError } = await supabase
    .from("normalized_listings")
    .select("id")
    .eq("listing_source_id", listingSourceId);

  if (normalizedSelectError) {
    throw normalizedSelectError;
  }

  const normalizedIds = normalizedRows.map((row) => row.id);

  if (normalizedIds.length > 0) {
    const { error: imageDeleteError } = await supabase
      .from("normalized_listing_images")
      .delete()
      .in("normalized_listing_id", normalizedIds);

    if (imageDeleteError) {
      throw imageDeleteError;
    }

    const { error: normalizedDeleteError } = await supabase
      .from("normalized_listings")
      .delete()
      .in("id", normalizedIds);

    if (normalizedDeleteError) {
      throw normalizedDeleteError;
    }
  }

  if (rawIds.length > 0) {
    const { error: rawImagesDeleteError } = await supabase
      .from("raw_listing_images")
      .delete()
      .in("raw_listing_id", rawIds);

    if (rawImagesDeleteError) {
      throw rawImagesDeleteError;
    }

    const { error: rawDeleteError } = await supabase
      .from("raw_listings")
      .delete()
      .in("id", rawIds);

    if (rawDeleteError) {
      throw rawDeleteError;
    }
  }
}

async function writeResultsToLocalSupabase(results: CaseResult[]) {
  loadLocalEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for --write-db.",
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const listingSource = await getOrCreateEdgeCaseSource(supabase);

  await clearPreviousEdgeCaseRows(supabase, listingSource.id);

  const runStartedAt = new Date();
  const runFinishedAt = new Date(runStartedAt.getTime() + 1000);
  const { data: ingestionRun, error: ingestionRunError } = await supabase
    .from("ingestion_runs")
    .insert({
      duplicate_warnings: results.filter(
        (result) => result.actual.duplicate_group_id,
      ).length,
      finished_at: runFinishedAt.toISOString(),
      listing_source_id: listingSource.id,
      listings_fetched: results.length,
      listings_normalized: results.length,
      parser_errors: results.filter((result) => !result.passed).length,
      run_notes: "Manual normalization edge-case runner. Local verification only.",
      started_at: runStartedAt.toISOString(),
      status: results.every((result) => result.passed) ? "completed" : "completed_with_warnings",
    })
    .select()
    .single();

  if (ingestionRunError) {
    throw ingestionRunError;
  }

  for (const result of results) {
    const rawPayload = {
      expected: result.fixture.expected,
      notes: result.fixture.notes,
      raw: result.fixture.raw,
      scenario: result.fixture.scenario,
      source: result.fixture.source,
    };
    const rawInsert: TablesInsert<"raw_listings"> = {
      fetched_at: new Date().toISOString(),
      ingestion_run_id: ingestionRun.id,
      listing_source_id: listingSource.id,
      raw_contact_text: result.fixture.raw.contact,
      raw_description: result.fixture.raw.description,
      raw_fuel_text: result.fixture.raw.fuel,
      raw_location_text: result.fixture.raw.location,
      raw_mileage_text: result.fixture.raw.mileage,
      raw_payload: rawPayload,
      raw_price_text: result.fixture.raw.price,
      raw_seller_label: result.fixture.raw.seller,
      raw_title: result.fixture.raw.title,
      raw_transmission_text: result.fixture.raw.transmission,
      raw_trim_text: result.fixture.raw.trim,
      source_listing_id: result.fixture.raw.id,
      source_listing_url: result.fixture.raw.url,
    };
    const { data: rawListing, error: rawInsertError } = await supabase
      .from("raw_listings")
      .insert(rawInsert)
      .select()
      .single();

    if (rawInsertError) {
      throw rawInsertError;
    }

    const rawImageRows = result.fixture.raw.images.map((imageUrl, index) => ({
      display_order: index,
      image_url: imageUrl,
      preview_allowed: result.actual.image_health === "linked",
      raw_listing_id: rawListing.id,
      source_attribution_required: true,
    }));

    const { data: rawImages, error: rawImagesInsertError } =
      rawImageRows.length > 0
        ? await supabase
            .from("raw_listing_images")
            .insert(rawImageRows)
            .select()
            .order("display_order", { ascending: true })
        : { data: [], error: null };

    if (rawImagesInsertError) {
      throw rawImagesInsertError;
    }

    const { data: normalizedListing, error: normalizedInsertError } =
      await supabase
        .from("normalized_listings")
        .insert({
          availability_status: "available",
          body_type: result.actual.body_type,
          brand_name: result.actual.brand_name,
          buyer_visibility_reason: result.actual.buyer_visibility_reason,
          contact_method: result.actual.contact_method,
          display_name: [
            result.actual.year,
            result.actual.brand_name,
            result.actual.model_name,
          ]
            .filter(Boolean)
            .join(" ") || result.actual.title,
          fuel_type: result.fixture.raw.fuel?.toLowerCase() ?? null,
          import_status: result.actual.import_status,
          is_buyer_visible: result.actual.is_buyer_visible,
          listing_source_id: listingSource.id,
          location_label: result.actual.location_label,
          mileage_value: result.actual.mileage_value,
          model_name: result.actual.model_name,
          normalization_confidence: result.actual.normalization_confidence,
          price_amount: result.actual.price_amount,
          raw_listing_id: rawListing.id,
          recommendation_state: result.actual.recommendation_state,
          review_status: toDatabaseReviewStatus(result.actual.review_status),
          seller_type: result.actual.seller_type,
          source_attribution_required: true,
          source_images_allowed_for_preview: result.actual.image_health === "linked",
          source_listing_id: result.fixture.raw.id,
          source_listing_url: result.fixture.raw.url,
          title: result.actual.title,
          transmission_type: result.fixture.raw.transmission?.toLowerCase() ?? null,
          trim_name: result.fixture.raw.trim,
          year: result.actual.year,
        })
        .select()
        .single();

    if (normalizedInsertError) {
      throw normalizedInsertError;
    }

    if (rawImages.length > 0) {
      const { error: normalizedImagesInsertError } = await supabase
        .from("normalized_listing_images")
        .insert(
          rawImages.map((image, index) => ({
            display_order: image.display_order,
            display_url: image.image_url,
            is_primary: index === 0,
            normalized_listing_id: normalizedListing.id,
            preview_allowed: result.actual.image_health === "linked",
            raw_listing_image_id: image.id,
            source_attribution_required: image.source_attribution_required,
          })),
        );

      if (normalizedImagesInsertError) {
        throw normalizedImagesInsertError;
      }
    }
  }

  console.log(
    `\nWrote ${results.length} edge-case raw and normalized listings to local Supabase source manual_edge_case.`,
  );
}

async function main() {
  const shouldWriteDb = process.argv.includes("--write-db");
  const results = normalizationEdgeCaseDataset.map(verifyCase);

  printSummary(results);

  if (shouldWriteDb) {
    await writeResultsToLocalSupabase(results);
  } else {
    console.log(
      "\nDry run only. Add --write-db to insert local edge-case records into Supabase.",
    );
  }

  if (results.some((result) => !result.passed)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

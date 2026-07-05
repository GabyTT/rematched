import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import type { Database, Tables } from "../lib/database.types";

type NormalizedListing = Tables<"normalized_listings">;
type NormalizedListingImage = Tables<"normalized_listing_images">;
type RawListing = Tables<"raw_listings">;

type ListingWithSignals = NormalizedListing & {
  image_urls: string[];
  raw_contact_text: string | null;
  raw_seller_label: string | null;
  raw_title: string | null;
};

type DuplicateCandidate = {
  confidence: number;
  listingA: ListingWithSignals;
  listingB: ListingWithSignals;
  matchedSignals: string[];
  reason: string;
  recommendedAction: "review_possible_duplicate";
};

const minimumReportConfidence = 0.5;
const localSupabaseUrlPattern = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/;
const localSupabaseJwtSecret =
  "super-secret-jwt-token-with-at-least-32-characters-long";

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

function createLocalServiceRoleKey() {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    exp: 1956571200,
    iat: 1640995200,
    iss: "supabase",
    ref: "rev-matched",
    role: "service_role",
  };
  const unsignedToken = `${encode(header)}.${encode(payload)}`;
  const signature = createHmac("sha256", localSupabaseJwtSecret)
    .update(unsignedToken)
    .digest("base64url");

  return `${unsignedToken}.${signature}`;
}

function getSupabaseConfig() {
  loadLocalEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!localSupabaseUrlPattern.test(supabaseUrl)) {
    throw new Error(
      "Refusing to run duplicate reporter against a non-local Supabase URL.",
    );
  }

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SERVICE_ROLE_KEY ??
    createLocalServiceRoleKey();

  return {
    serviceRoleKey,
    supabaseUrl,
  };
}

function normalizeText(value: string | null) {
  return value?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

function broadModelKey(value: string | null) {
  return normalizeText(value)
    .replace(/\b(toyota|nissan|honda|audi)\b/g, "")
    .replace(/\b(corolla|hybrid|roro|fresh import|special)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clusterKey(listing: NormalizedListing) {
  return [
    normalizeText(listing.brand_name),
    broadModelKey(listing.model_name),
    listing.year ?? "unknown-year",
  ].join("|");
}

function normalizedContact(value: string | null) {
  const digits = value?.replace(/[^\d]/g, "") ?? "";

  if (digits.length >= 7) {
    return digits;
  }

  return normalizeText(value);
}

function contactsMatch(left: string | null, right: string | null) {
  const leftContact = normalizedContact(left);
  const rightContact = normalizedContact(right);

  if (!leftContact || !rightContact) {
    return false;
  }

  if (/^\d+$/.test(leftContact) && /^\d+$/.test(rightContact)) {
    return (
      leftContact.endsWith(rightContact) ||
      rightContact.endsWith(leftContact) ||
      leftContact.slice(-7) === rightContact.slice(-7)
    );
  }

  return leftContact === rightContact;
}

function exactImageOverlap(left: string[], right: string[]) {
  const rightImages = new Set(right);

  return left.filter((imageUrl) => rightImages.has(imageUrl));
}

function pricesWithinFivePercent(left: number | null, right: number | null) {
  if (left === null || right === null) {
    return false;
  }

  const denominator = Math.max(left, right);

  if (denominator === 0) {
    return left === right;
  }

  return Math.abs(left - right) / denominator <= 0.05;
}

function mileageMatch(left: number | null, right: number | null) {
  if (left === null || right === null) {
    return null;
  }

  if (left === right) {
    return "exact";
  }

  return Math.abs(left - right) <= 1000 ? "close" : null;
}

function sameLocation(left: string | null, right: string | null) {
  const leftLocation = normalizeText(left);
  const rightLocation = normalizeText(right);

  return Boolean(leftLocation && rightLocation && leftLocation === rightLocation);
}

function hasAmbiguousModelIdentity(listing: ListingWithSignals) {
  return Boolean(
    listing.model_name?.includes("/") ||
      listing.title?.includes("/") ||
      listing.raw_title?.includes("/"),
  );
}

function confidencePenaltyForNormalization(listing: ListingWithSignals) {
  const confidence = listing.normalization_confidence;

  if (confidence === null) {
    return 0.05;
  }

  if (confidence < 0.6) {
    return 0.1;
  }

  if (confidence < 0.75) {
    return 0.05;
  }

  return 0;
}

function sameVehicleIdentity(left: ListingWithSignals, right: ListingWithSignals) {
  return (
    normalizeText(left.brand_name) === normalizeText(right.brand_name) &&
    broadModelKey(left.model_name) === broadModelKey(right.model_name) &&
    left.year !== null &&
    left.year === right.year
  );
}

function compareListings(
  left: ListingWithSignals,
  right: ListingWithSignals,
): DuplicateCandidate | null {
  const matchedSignals: string[] = [];
  let confidence = 0;

  if (
    left.source_listing_id &&
    right.source_listing_id &&
    left.source_listing_id === right.source_listing_id
  ) {
    confidence += 0.95;
    matchedSignals.push("same_source_listing_id");
  }

  const overlappingImages = exactImageOverlap(left.image_urls, right.image_urls);

  if (overlappingImages.length > 0) {
    confidence += 0.35;
    matchedSignals.push(`same_image_url:${overlappingImages.length}`);
  }

  if (contactsMatch(left.raw_contact_text, right.raw_contact_text)) {
    confidence += 0.3;
    matchedSignals.push("same_seller_contact");
  }

  if (sameVehicleIdentity(left, right)) {
    confidence += 0.2;
    matchedSignals.push("same_make_model_year");
  }

  const mileageSignal = mileageMatch(left.mileage_value, right.mileage_value);

  if (mileageSignal === "exact") {
    confidence += 0.2;
    matchedSignals.push("exact_mileage");
  } else if (mileageSignal === "close") {
    confidence += 0.15;
    matchedSignals.push("close_mileage");
  }

  if (pricesWithinFivePercent(left.price_amount, right.price_amount)) {
    confidence += 0.1;
    matchedSignals.push("price_within_5_percent");
  }

  if (sameLocation(left.location_label, right.location_label)) {
    confidence += 0.05;
    matchedSignals.push("same_location");
  }

  const normalizationPenalty =
    confidencePenaltyForNormalization(left) +
    confidencePenaltyForNormalization(right);

  if (normalizationPenalty > 0) {
    confidence -= normalizationPenalty;
    matchedSignals.push(`normalization_confidence_penalty:${normalizationPenalty.toFixed(2)}`);
  }

  if (hasAmbiguousModelIdentity(left) || hasAmbiguousModelIdentity(right)) {
    confidence -= 0.1;
    matchedSignals.push("ambiguous_model_identity_penalty");
  }

  const duplicateConfidence = Math.max(
    0,
    Math.min(0.95, Number(confidence.toFixed(2))),
  );

  if (duplicateConfidence < minimumReportConfidence) {
    return null;
  }

  return {
    confidence: duplicateConfidence,
    listingA: left,
    listingB: right,
    matchedSignals,
    reason: buildReason(matchedSignals),
    recommendedAction: "review_possible_duplicate",
  };
}

function buildReason(signals: string[]) {
  if (signals.some((signal) => signal.startsWith("same_image_url"))) {
    return "Listings share image URLs and should be reviewed as possible duplicates.";
  }

  if (signals.includes("same_seller_contact") && signals.includes("exact_mileage")) {
    return "Listings share seller contact and exact mileage.";
  }

  if (signals.includes("same_make_model_year") && signals.includes("price_within_5_percent")) {
    return "Listings share vehicle identity with close pricing.";
  }

  return "Listings have enough overlapping signals to require duplicate review.";
}

function groupListingsByCluster(listings: ListingWithSignals[]) {
  const groups = new Map<string, ListingWithSignals[]>();

  for (const listing of listings) {
    const key = clusterKey(listing);
    const group = groups.get(key) ?? [];

    group.push(listing);
    groups.set(key, group);
  }

  return groups;
}

async function readListingsForReport() {
  const { serviceRoleKey, supabaseUrl } = getSupabaseConfig();
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data: listings, error: listingsError } = await supabase
    .from("normalized_listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (listingsError) {
    throw listingsError;
  }

  const listingIds = listings.map((listing) => listing.id);
  const rawListingIds = listings
    .map((listing) => listing.raw_listing_id)
    .filter((id): id is string => Boolean(id));
  const { data: images, error: imagesError } =
    listingIds.length > 0
      ? await supabase
          .from("normalized_listing_images")
          .select("*")
          .in("normalized_listing_id", listingIds)
      : { data: [] as NormalizedListingImage[], error: null };

  if (imagesError) {
    throw imagesError;
  }

  const { data: rawListings, error: rawListingsError } =
    rawListingIds.length > 0
      ? await supabase
          .from("raw_listings")
          .select("*")
          .in("id", rawListingIds)
      : { data: [] as RawListing[], error: null };

  if (rawListingsError) {
    throw rawListingsError;
  }

  const imagesByListingId = new Map<string, string[]>();
  const rawListingById = new Map(
    rawListings.map((rawListing) => [rawListing.id, rawListing]),
  );

  for (const image of images) {
    const urls = imagesByListingId.get(image.normalized_listing_id) ?? [];

    urls.push(image.display_url);
    imagesByListingId.set(image.normalized_listing_id, urls);
  }

  return listings.map((listing) => {
    const rawListing = listing.raw_listing_id
      ? rawListingById.get(listing.raw_listing_id)
      : undefined;

    return {
      ...listing,
      image_urls: imagesByListingId.get(listing.id) ?? [],
      raw_contact_text: rawListing?.raw_contact_text ?? null,
      raw_seller_label: rawListing?.raw_seller_label ?? null,
      raw_title: rawListing?.raw_title ?? null,
    };
  });
}

function findDuplicateCandidates(listings: ListingWithSignals[]) {
  const groups = groupListingsByCluster(listings);
  const candidates: DuplicateCandidate[] = [];

  for (const group of groups.values()) {
    if (group.length < 2) {
      continue;
    }

    for (let leftIndex = 0; leftIndex < group.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < group.length;
        rightIndex += 1
      ) {
        const candidate = compareListings(group[leftIndex], group[rightIndex]);

        if (candidate) {
          candidates.push(candidate);
        }
      }
    }
  }

  return candidates.sort((left, right) => right.confidence - left.confidence);
}

function formatListing(listing: ListingWithSignals) {
  return `${listing.source_listing_id ?? listing.id} | ${listing.display_name} | ${
    listing.price_amount === null ? "price unknown" : `$${listing.price_amount}`
  } | ${listing.mileage_value === null ? "mileage unknown" : `${listing.mileage_value} km`}`;
}

function printReport(input: {
  candidates: DuplicateCandidate[];
  listingCount: number;
}) {
  console.log("\nDuplicate Candidate Reporter");
  console.log("============================");
  console.log(`Listings scanned: ${input.listingCount}`);
  console.log(`Candidate pairs found: ${input.candidates.length}`);
  console.log("Mode: dry-run only; no database writes performed.");

  if (input.candidates.length === 0) {
    console.log("\nNo possible duplicate candidates met the reporting threshold.");
    return;
  }

  console.log("\nCandidate Summary");
  console.table(
    input.candidates.map((candidate) => ({
      confidence: candidate.confidence.toFixed(2),
      listing_a: candidate.listingA.source_listing_id ?? candidate.listingA.id,
      listing_b: candidate.listingB.source_listing_id ?? candidate.listingB.id,
      recommended_action: candidate.recommendedAction,
      signals: candidate.matchedSignals.join(", "),
    })),
  );

  console.log("\nCandidate Details");

  input.candidates.forEach((candidate, index) => {
    console.log(`\n${index + 1}. Confidence ${candidate.confidence.toFixed(2)}`);
    console.log(`A: ${formatListing(candidate.listingA)}`);
    console.log(`B: ${formatListing(candidate.listingB)}`);
    console.log(`Signals: ${candidate.matchedSignals.join(", ")}`);
    console.log(`Reason: ${candidate.reason}`);
    console.log(`Recommended action: ${candidate.recommendedAction}`);
  });
}

async function main() {
  const listings = await readListingsForReport();
  const candidates = findDuplicateCandidates(listings);

  printReport({
    candidates,
    listingCount: listings.length,
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

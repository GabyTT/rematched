import type { ListingSourceAdapter, SourceListing } from "./sourceAdapter.ts";

const BASE_URL = "https://www.trinicarsforsale.com";
const LIST_URL = `${BASE_URL}/database/featuredcarsList.php`;
const DEFAULT_LIMIT = 5;
const MAX_TEST_LIMIT = 5;
const MAX_MANUAL_IMPORT_LIMIT = 90;
const MAX_PREFLIGHT_PAGES = 3;

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type ParsedDetail = {
  make: string | null;
  model: string | null;
  year: string | null;
  colour: string | null;
  engineSize: string | null;
  plateSeries: string | null;
  mileage: string | null;
  transmission: string | null;
  features: string[];
  additionalInfo: string | null;
  askingPrice: string | null;
  dateAdded: string | null;
  contactName: string | null;
  contactPhoneText: string | null;
  primaryImageUrl: string | null;
};

type ParsedListSummary = {
  contactText: string | null;
};

export type TriniCarsDatePreflight = {
  sourceListingDate: string;
  pagesChecked: number;
  listings: Array<{
    sourceListingId: string;
    title: string;
    sourceListingUrl: string;
    sourcePostedText: string;
  }>;
};

function toSourceSiteMidnightIso(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}T00:00:00-04:00`;
}

function parseUnambiguousSourceDate(dateText: string | null) {
  if (!dateText) return null;

  const value = dateText.trim();
  if (!value) return null;
  const normalizedValue = value.replace(
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b\s+/i,
    "",
  );
  const ordinalStrippedValue = normalizedValue.replace(
    /\b(\d{1,2})(st|nd|rd|th)\b/gi,
    "$1",
  );

  const monthNameMatch = ordinalStrippedValue.match(
    /\b([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})\b|\b(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})\b/,
  );

  if (monthNameMatch) {
    const monthNames = new Map([
      ["jan", 1],
      ["feb", 2],
      ["mar", 3],
      ["apr", 4],
      ["may", 5],
      ["jun", 6],
      ["jul", 7],
      ["aug", 8],
      ["sep", 9],
      ["oct", 10],
      ["nov", 11],
      ["dec", 12],
    ]);

    const monthToken = (monthNameMatch[1] ?? monthNameMatch[5] ?? "").slice(0, 3).toLowerCase();
    const month = monthNames.get(monthToken);
    const day = Number(monthNameMatch[2] ?? monthNameMatch[4]);
    const year = Number(monthNameMatch[3] ?? monthNameMatch[6]);

    if (month && day >= 1 && day <= 31 && year >= 2000) {
      return toSourceSiteMidnightIso(year, month, day);
    }
  }

  const yearFirstMatch = ordinalStrippedValue.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (yearFirstMatch) {
    const year = Number(yearFirstMatch[1]);
    const month = Number(yearFirstMatch[2]);
    const day = Number(yearFirstMatch[3]);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return toSourceSiteMidnightIso(year, month, day);
    }
  }

  const numericMatch = ordinalStrippedValue.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (!numericMatch) return null;

  const first = Number(numericMatch[1]);
  const second = Number(numericMatch[2]);
  const year = Number(numericMatch[3]);

  if (first > 12 && second >= 1 && second <= 12) {
    return toSourceSiteMidnightIso(year, second, first);
  }

  if (second > 12 && first >= 1 && first <= 12) {
    return toSourceSiteMidnightIso(year, first, second);
  }

  return null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function textContent(value: string) {
  return decodeHtml(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTriniCarsListingIds(html: string, limit = DEFAULT_LIMIT) {
  const ids: string[] = [];
  const seen = new Set<string>();
  const pattern = /featuredcarsDetails\.php\?(\d+-\d+)/gi;

  for (const match of html.matchAll(pattern)) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length === limit) break;
  }

  return ids;
}

export function parseTriniCarsListSummaries(html: string) {
  const summaries = new Map<string, ParsedListSummary>();
  const entryPattern =
    /<a href="\/database\/featuredcarsDetails\.php\?(\d+-\d+)#topofpage">[\s\S]*?<\/table>\s*<\/font><\/td>\s*<\/tr>/gi;

  for (const match of html.matchAll(entryPattern)) {
    const sourceListingId = match[1];
    const block = match[0];

    summaries.set(sourceListingId, {
      contactText: valueFromRows(block, "Contact"),
    });
  }

  return summaries;
}

function valueFromRows(html: string, label: string) {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(
    (match) => textContent(match[1]),
  );
  const row = rows.find((candidate) => candidate.startsWith(`${label}:`));
  return row?.slice(label.length + 1).trim() || null;
}

function featureLabelsFromText(value: string | null) {
  if (!value) return [];

  const ignoredValues = new Set(["n/a", "none", "not available", "not applicable"]);
  const seen = new Set<string>();

  return value
    .split(",")
    .map((label) => label.replace(/\s+/g, " ").trim())
    .filter((label) => label && !ignoredValues.has(label.toLowerCase()))
    .filter((label) => {
      const key = label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function plateSeriesFromHeader(html: string) {
  const text = textContent(html).replace(/\s+/g, " ").trim();
  const match = text.match(/\b\d{5,7}\s+([A-Z]{2,4})\s+Make:/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function isNegotiablePrice(value: string | null) {
  return /\bnegotiable\b/i.test(value ?? "");
}

export function parseTriniCarsDetail(html: string): ParsedDetail {
  const imageMatch = html.match(
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
  );
  const primaryImageUrl = imageMatch?.[1]
    ? new URL(decodeHtml(imageMatch[1]), BASE_URL).toString().replace(/^http:/, "https:")
    : null;

  return {
    make: valueFromRows(html, "Make"),
    model: valueFromRows(html, "Model"),
    year: valueFromRows(html, "Year"),
    colour: valueFromRows(html, "Colour"),
    engineSize: valueFromRows(html, "Engine Size"),
    plateSeries: plateSeriesFromHeader(html),
    mileage: valueFromRows(html, "Mileage"),
    transmission: valueFromRows(html, "Transmission"),
    features: featureLabelsFromText(valueFromRows(html, "Features")),
    additionalInfo: valueFromRows(html, "Additional Info"),
    askingPrice: valueFromRows(html, "Asking Price"),
    dateAdded: valueFromRows(html, "Date Added"),
    contactName: valueFromRows(html, "Contact Name"),
    contactPhoneText:
      valueFromRows(html, "Contact Phone #'s") ?? valueFromRows(html, "Contact Phone #"),
    primaryImageUrl,
  };
}

function fuelFromEngine(engineSize: string | null) {
  if (!engineSize) return null;
  const match = engineSize.match(/\b(diesel|petrol|gasoline|gas|hybrid|electric)\b/i);
  return match?.[1] ?? null;
}

async function fetchHtml(fetchImpl: FetchLike, url: string) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "RevMatchedTestImporter/0.1 (private development test)",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`TriniCarsForSale returned HTTP ${response.status} for ${url}.`);
  }

  return response.text();
}

function toSourceListing(
  sourceListingId: string,
  detail: ParsedDetail,
  summary?: ParsedListSummary,
): SourceListing {
  const sourceListingUrl = `${BASE_URL}/database/featuredcarsDetails.php?${sourceListingId}`;
  const titleParts = [detail.year, detail.make, detail.model].filter(Boolean);
  const contactText = summary?.contactText ?? detail.contactPhoneText ?? null;
  const sellerLabel = detail.contactName ?? null;
  const sourcePostedText = detail.dateAdded?.trim() || null;
  const sourcePostedAt = parseUnambiguousSourceDate(sourcePostedText);

  return {
    sourceListingId,
    sourceListingUrl,
    title: titleParts.join(" ") || `TriniCars listing ${sourceListingId}`,
    // Source wording remains admin-only evidence. The seller confirms any details
    // that later become buyer-facing.
    description: detail.additionalInfo,
    priceText: detail.askingPrice,
    locationText: null,
    contactText,
    sellerLabel,
    mileageText: detail.mileage,
    fuelText: fuelFromEngine(detail.engineSize),
    transmissionText: detail.transmission,
    trimText: null,
    featuresText: detail.features.join(", ") || null,
    colourText: detail.colour,
    engineSizeText: detail.engineSize,
    plateSeriesText: detail.plateSeries,
    isNegotiable: isNegotiablePrice(detail.askingPrice),
    images: detail.primaryImageUrl
      ? [{ url: detail.primaryImageUrl, previewAllowed: false }]
      : [],
    rawPayload: {
      test_mode: true,
      source_listing_id: sourceListingId,
      source_listing_url: sourceListingUrl,
      make: detail.make,
      model: detail.model,
      year: detail.year,
      colour: detail.colour,
      engine_size: detail.engineSize,
      plate_series: detail.plateSeries,
      mileage: detail.mileage,
      transmission: detail.transmission,
      features: detail.features,
      additional_info: detail.additionalInfo,
      asking_price: detail.askingPrice,
      is_negotiable: isNegotiablePrice(detail.askingPrice),
      date_added: detail.dateAdded,
      source_posted_at_parsed: sourcePostedAt,
      admin_review_image_reference: detail.primaryImageUrl,
      admin_review_image_reference_only: true,
      buyer_image_preview_allowed: false,
      public_contact_name: sellerLabel,
      public_contact_name_captured_for_admin_review: Boolean(sellerLabel),
      public_contact_text: contactText,
      public_contact_captured_for_admin_review: Boolean(contactText),
      admin_only_contact_usage: true,
    },
    sourcePostedAt,
    sourcePostedText,
    sourceRefreshedAt: null,
    sourceRefreshedText: null,
  };
}

function sourceDateKey(value: string | null | undefined) {
  return value?.slice(0, 10) ?? null;
}

function compareSourceListingsOldestFirst(left: SourceListing, right: SourceListing) {
  const dateComparison = (left.sourcePostedAt ?? "").localeCompare(right.sourcePostedAt ?? "");
  if (dateComparison !== 0) return dateComparison;

  const leftSequence = Number(left.sourceListingId.split("-", 1)[0]);
  const rightSequence = Number(right.sourceListingId.split("-", 1)[0]);
  if (Number.isFinite(leftSequence) && Number.isFinite(rightSequence) && leftSequence !== rightSequence) {
    return leftSequence - rightSequence;
  }

  return left.sourceListingId.localeCompare(right.sourceListingId);
}

function listPageUrl(page: number) {
  return page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`;
}

async function fetchListingsForIds(
  fetchImpl: FetchLike,
  sourceListingIds: string[],
  summaries?: Map<string, ParsedListSummary>,
) {
  const listings: SourceListing[] = [];

  for (const id of sourceListingIds) {
    const detailUrl = `${BASE_URL}/database/featuredcarsDetails.php?${id}`;
    const detailHtml = await fetchHtml(fetchImpl, detailUrl);
    listings.push(toSourceListing(id, parseTriniCarsDetail(detailHtml), summaries?.get(id)));
  }

  return listings;
}

export async function previewTriniCarsForSaleListingsForDate(options: {
  sourceListingDate: string;
  fetchImpl?: FetchLike;
}): Promise<TriniCarsDatePreflight> {
  const sourceListingDate = options.sourceListingDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sourceListingDate)) {
    throw new Error("Choose a valid source-listing date before checking the source.");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const matchingListings: SourceListing[] = [];

  for (let page = 1; page <= MAX_PREFLIGHT_PAGES; page += 1) {
    const listHtml = await fetchHtml(fetchImpl, listPageUrl(page));
    const ids = parseTriniCarsListingIds(listHtml, Number.MAX_SAFE_INTEGER);
    const summaries = parseTriniCarsListSummaries(listHtml);

    if (ids.length === 0) break;

    const listings = await fetchListingsForIds(fetchImpl, ids, summaries);
    const datedListings = listings.filter((listing) => sourceDateKey(listing.sourcePostedAt));

    if (datedListings.length === 0) {
      throw new Error("TriniCarsForSale did not provide usable added dates for this page.");
    }

    matchingListings.push(
      ...datedListings.filter(
        (listing) => sourceDateKey(listing.sourcePostedAt) === sourceListingDate,
      ),
    );

    const foundAnEarlierDate = datedListings.some((listing) => {
      const listingDate = sourceDateKey(listing.sourcePostedAt);
      return listingDate ? listingDate < sourceListingDate : false;
    });

    if (foundAnEarlierDate || ids.length < 30) {
      return {
        sourceListingDate,
        pagesChecked: page,
        listings: matchingListings
          .sort(compareSourceListingsOldestFirst)
          .map((listing) => ({
            sourceListingId: listing.sourceListingId,
            title: listing.title ?? `TriniCars listing ${listing.sourceListingId}`,
            sourceListingUrl: listing.sourceListingUrl,
            sourcePostedText: listing.sourcePostedText ?? sourceListingDate,
          })),
      };
    }
  }

  throw new Error(
    "Rev Matched could not safely finish counting this date after checking the newest three source pages. Choose a more recent date and try again.",
  );
}

export function createTriniCarsForSaleBackfillAdapter(options: {
  sourceListingIds: string[];
  fetchImpl?: FetchLike;
}): ListingSourceAdapter {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceListingIds = [...new Set(options.sourceListingIds.map((id) => id.trim()))].filter(
    Boolean,
  );

  if (sourceListingIds.length === 0) {
    throw new Error("TriniCars backfill requires at least one source listing ID.");
  }

  return {
    source: {
      name: "TriniCarsForSale",
      type: "marketplace",
      baseUrl: BASE_URL,
      notes:
        "Private development backfill only. Existing stored TriniCars records may be refreshed with admin-only remote image references and public contact details for admin review, while buyer exposure and automated outreach remain blocked.",
    },
    async fetchListings() {
      const listings: SourceListing[] = [];

      for (const id of sourceListingIds) {
        const detailUrl = `${BASE_URL}/database/featuredcarsDetails.php?${id}`;
        try {
          const detailHtml = await fetchHtml(fetchImpl, detailUrl);
          listings.push(toSourceListing(id, parseTriniCarsDetail(detailHtml)));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);

          if (message.includes("HTTP 404")) {
            console.warn(
              `Skipping TriniCars backfill for ${id} because the source detail page is no longer available.`,
            );
            continue;
          }

          throw error;
        }
      }

      return listings;
    },
  };
}

export function createTriniCarsForSaleTestAdapter(options?: {
  fetchImpl?: FetchLike;
  limit?: number;
  sourceListingIds?: string[];
}): ListingSourceAdapter {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const sourceListingIds = [
    ...new Set((options?.sourceListingIds ?? []).map((id) => id.trim()).filter(Boolean)),
  ];

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_TEST_LIMIT) {
    throw new Error(`TriniCars test imports are limited to 1-${MAX_TEST_LIMIT} listings.`);
  }

  if (sourceListingIds.length > MAX_MANUAL_IMPORT_LIMIT) {
    throw new Error(
      `Manual TriniCars imports are limited to ${MAX_MANUAL_IMPORT_LIMIT} listings at a time.`,
    );
  }

  return {
    source: {
      name: "TriniCarsForSale",
      type: "marketplace",
      baseUrl: BASE_URL,
      notes:
        "Private development test only. Maximum five listings; one admin-only remote image reference and public source contact text may be retained for admin review, while buyer exposure and automated outreach remain blocked.",
    },
    async fetchListings() {
      if (sourceListingIds.length > 0) {
        return fetchListingsForIds(fetchImpl, sourceListingIds);
      }

      const listHtml = await fetchHtml(fetchImpl, LIST_URL);
      const ids = parseTriniCarsListingIds(listHtml, limit);
      const listSummaries = parseTriniCarsListSummaries(listHtml);

      if (ids.length < limit) {
        throw new Error(`Expected ${limit} TriniCars listings but found ${ids.length}.`);
      }

      const listings: SourceListing[] = [];
      for (const id of ids) {
        const detailUrl = `${BASE_URL}/database/featuredcarsDetails.php?${id}`;
        const detailHtml = await fetchHtml(fetchImpl, detailUrl);
        listings.push(
          toSourceListing(id, parseTriniCarsDetail(detailHtml), listSummaries.get(id)),
        );
      }

      return listings;
    },
  };
}

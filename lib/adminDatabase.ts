import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { decideListingImage, type ListingImageDecision } from "@/lib/listingImagePolicy";
import { hasSellerSubmissionBuyerFacingChanges } from "@/lib/sellerSubmissionReview";
import {
  getListingWorkflowPipelineStage,
  isListingWorkflowStatus,
  type ListingWorkflowStatus,
} from "@/lib/listingWorkflow";
import { getSupabaseBrowserEnv } from "@/lib/supabase/env";

export type DatabaseAdminListing = {
  id: string;
  source: string;
  sourceListingId: string;
  sourceUrl: string | null;
  sourceMissingAt: string | null;
  adminSourceContactName: string | null;
  adminSourceContact: string | null;
  title: string;
  priceAmount: number | null;
  year: number | null;
  brand: string | null;
  model: string | null;
  availabilityStatus: string;
  recommendationState: string;
  reviewStatus: string;
  workflowStatus: ListingWorkflowStatus;
  sellerAgreementConfirmed: boolean;
  sellerAccess: SellerAccessSummary | null;
  sellerMediaAssets: SellerMediaAssetSummary[];
  sellerUpdate: SellerUpdateSummary | null;
  expectedAssetsAt: string | null;
  followUpAt: string | null;
  buyerVisible: boolean;
  normalizationConfidence: number | null;
  buyerVisibilityReason: string | null;
  systemDoubtNote: string | null;
  adminReviewImageUrl: string | null;
  imageDecision: ListingImageDecision;
  fetchedAt: string | null;
  sourcePostedAt: string | null;
  sourcePostedText: string | null;
  sourceRefreshedAt: string | null;
  sourceRefreshedText: string | null;
  sourceFeatures: string | null;
  sourceAdditionalInfo: string | null;
  colour: string | null;
  engineSize: string | null;
  plateSeries: string | null;
};

export type SellerAccessSummary = {
  sellerAccountId: string;
  displayName: string | null;
  phoneE164: string;
  accessCodeExpiresAt: string | null;
  linkedListingCount: number;
};

export type SellerMediaAssetSummary = {
  id: string;
  approvalStatus: "pending" | "approved" | "rejected";
  isPreferredMain: boolean;
  originalFilename: string;
  previewUrl: string | null;
  reviewNote: string | null;
  uploadedAt: string;
};

export type SellerUpdateSummary = {
  reviewStatus: "pending" | "approved" | "rejected";
  hasBuyerFacingChanges: boolean;
  reviewNote: string | null;
  pendingReviewAt: string | null;
  submittedAt: string | null;
};

export type DatabaseIngestionSource = {
  id: string;
  sourceName: string;
  sourceType: string;
  baseUrl: string | null;
  ingestionEnabled: boolean;
  ingestionMode: "manual" | "automatic_daily";
  scheduledRunTime: string;
  adminPreviewImageUrl: string | null;
  adminPreviewListingTitle: string | null;
  hasImportedListings: boolean;
};

export type DatabaseIngestionRun = {
  id: string;
  source: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  listingsFetched: number;
  listingsNormalized: number;
  parserErrors: number;
  duplicateWarnings: number;
  manualImportType: "test" | "full" | null;
  sourceListingDate: string | null;
  sourceListingsFound: number | null;
  sourceListingIds: string[];
};

export type DatabaseAdminDashboardMetrics = {
  latestIngestionRun: DatabaseIngestionRun | null;
  newImportsToday: number;
  sellerPhotosAwaitingReview: number;
  sellerUpdatesAwaitingReview: number;
  workflowCounts: {
    assetsReceived: number;
    imported: number;
    live: number;
    sellerContacted: number;
    verified: number;
  };
};

function getPortOfSpainDateKey(value: Date | string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Port_of_Spain",
  }).format(new Date(value));
}

function readSourceListingIds(value: Database["public"]["Tables"]["ingestion_runs"]["Row"]["source_listing_ids"]) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function getPrimaryNormalizedImageUrl(
  images: Array<{ display_url: string; display_order: number | null }>,
) {
  return [...images]
    .filter((image) => image.display_url.trim() !== "")
    .sort(
      (first, second) => (first.display_order ?? Number.MAX_SAFE_INTEGER) - (second.display_order ?? Number.MAX_SAFE_INTEGER),
    )[0]?.display_url ?? null;
}

const HIDDEN_ADMIN_TEST_SOURCES = new Set([
  "controlled_sample",
  "manual_edge_case",
  "manual_test",
  "Normalized Helper Smoke Source",
]);

export function createLocalAdminClient() {
  const { supabaseUrl } = getSupabaseBrowserEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isLocalSupabase = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(
    supabaseUrl,
  );

  if (process.env.NODE_ENV !== "development" || !isLocalSupabase) {
    throw new Error(
      "Real admin inventory is currently limited to local development until admin authentication is implemented.",
    );
  }

  if (!serviceRoleKey) {
    throw new Error("Missing local SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function buildSystemDoubtNote(input: {
  adminSourceContact: string | null;
  adminSourceContactName: string | null;
  buyerVisibilityReason: string | null;
  normalizationConfidence: number | null;
  recommendationState: string;
  reviewStatus: string;
  sourceMissingAt: string | null;
  year: number | null;
}) {
  const notes: string[] = [];

  if (input.buyerVisibilityReason) {
    notes.push(input.buyerVisibilityReason);
  }

  if (input.normalizationConfidence !== null && input.normalizationConfidence < 0.6) {
    notes.push("Parsing confidence is low, so the listing structure may still be incomplete.");
  } else if (
    input.normalizationConfidence !== null &&
    input.normalizationConfidence < 0.75 &&
    !input.buyerVisibilityReason
  ) {
    notes.push("Some listing fields were recovered, but the system is not fully confident.");
  }

  if (input.year === null) {
    notes.push("Year is still missing from the normalized record.");
  }

  if (input.sourceMissingAt) {
    notes.push("This listing was not returned by a later full source check and needs admin review. It has not been removed automatically.");
  }

  if (!input.adminSourceContactName?.trim()) {
    notes.push("Source did not clearly provide a seller name.");
  }

  if (!input.adminSourceContact?.trim()) {
    notes.push("Source did not clearly provide seller contact details.");
  }

  if (
    input.recommendationState === "review_required" ||
    input.reviewStatus === "review_required"
  ) {
    notes.push("This listing still needs admin review before it can be treated as confident inventory.");
  }

  const uniqueNotes = [...new Set(notes.filter(Boolean))];
  return uniqueNotes.length > 0 ? uniqueNotes.join(" ") : null;
}

export async function getDatabaseAdminListings(): Promise<DatabaseAdminListing[]> {
  const supabase = createLocalAdminClient();
  const { data, error } = await supabase
    .from("normalized_listings")
    .select(
      "id, source_listing_id, source_listing_url, source_missing_at, display_name, title, price_amount, is_negotiable, year, brand_name, model_name, trim_name, mileage_value, fuel_type, transmission_type, body_type, location_label, public_contact_name, public_contact_phone, colour, engine_size, plate_series, availability_status, recommendation_state, review_status, workflow_status, is_buyer_visible, normalization_confidence, buyer_visibility_reason, source_images_allowed_for_preview, raw_listings(raw_contact_text, raw_seller_label, raw_description, raw_features_text, fetched_at, source_posted_at, source_posted_text, source_refreshed_at, source_refreshed_text), listing_sources!inner(source_name), normalized_listing_images(id, display_url, display_order, preview_allowed)",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  const listingIds = data.map((listing) => listing.id);
  const { data: workflowEvents, error: workflowEventsError } = listingIds.length
    ? await supabase
        .from("listing_workflow_events")
        .select(
          "normalized_listing_id, seller_contact_outcome, expected_assets_at, follow_up_at, occurred_at",
        )
        .in("normalized_listing_id", listingIds)
        .order("occurred_at", { ascending: false })
    : { data: [], error: null };

  if (workflowEventsError) throw workflowEventsError;

  const { data: listingAssignments, error: listingAssignmentsError } = listingIds.length
    ? await supabase
        .from("seller_listing_assignments")
        .select("normalized_listing_id, seller_account_id")
        .in("normalized_listing_id", listingIds)
    : { data: [], error: null };

  if (listingAssignmentsError) throw listingAssignmentsError;

  const { data: sellerMediaAssets, error: sellerMediaAssetsError } = listingIds.length
    ? await supabase
        .from("seller_listing_media_assets")
        .select("id, normalized_listing_id, storage_path, original_filename, approval_status, is_preferred_main, review_note, uploaded_at")
        .in("normalized_listing_id", listingIds)
        .order("uploaded_at", { ascending: false })
    : { data: [], error: null };

  if (sellerMediaAssetsError) throw sellerMediaAssetsError;

  const { data: sellerSubmissions, error: sellerSubmissionsError } = listingIds.length
    ? await supabase
        .from("seller_listing_submissions")
        .select("normalized_listing_id, status, admin_review_status, admin_review_note, pending_review_at, submitted_at, display_name, price_amount, is_negotiable, year, brand_name, model_name, trim_name, colour, engine_size, plate_series, mileage_value, transmission_type, fuel_type, body_type, location_label, public_contact_name, public_contact_phone")
        .in("normalized_listing_id", listingIds)
    : { data: [], error: null };

  if (sellerSubmissionsError) throw sellerSubmissionsError;

  const sellerAccountIds = [...new Set((listingAssignments ?? []).map((assignment) => assignment.seller_account_id))];
  const { data: sellerAccounts, error: sellerAccountsError } = sellerAccountIds.length
    ? await supabase
        .from("seller_accounts")
        .select("id, display_name, phone_e164")
        .in("id", sellerAccountIds)
    : { data: [], error: null };

  if (sellerAccountsError) throw sellerAccountsError;

  const { data: sellerAccessCodes, error: sellerAccessCodesError } = sellerAccountIds.length
    ? await supabase
        .from("seller_access_codes")
        .select("seller_account_id, expires_at")
        .in("seller_account_id", sellerAccountIds)
    : { data: [], error: null };

  if (sellerAccessCodesError) throw sellerAccessCodesError;

  const { data: allSellerAssignments, error: allSellerAssignmentsError } = sellerAccountIds.length
    ? await supabase
        .from("seller_listing_assignments")
        .select("seller_account_id")
        .in("seller_account_id", sellerAccountIds)
    : { data: [], error: null };

  if (allSellerAssignmentsError) throw allSellerAssignmentsError;

  const latestWorkflowEventByListingId = new Map<string, (typeof workflowEvents)[number]>();
  (workflowEvents ?? []).forEach((event) => {
    if (!latestWorkflowEventByListingId.has(event.normalized_listing_id)) {
      latestWorkflowEventByListingId.set(event.normalized_listing_id, event);
    }
  });

  const sellerAccountById = new Map(
    (sellerAccounts ?? []).map((sellerAccount) => [sellerAccount.id, sellerAccount]),
  );
  const accessCodeBySellerAccountId = new Map(
    (sellerAccessCodes ?? []).map((accessCode) => [accessCode.seller_account_id, accessCode]),
  );
  const linkedListingCountBySellerAccountId = new Map<string, number>();
  (allSellerAssignments ?? []).forEach((assignment) => {
    linkedListingCountBySellerAccountId.set(
      assignment.seller_account_id,
      (linkedListingCountBySellerAccountId.get(assignment.seller_account_id) ?? 0) + 1,
    );
  });
  const sellerAccessByListingId = new Map<string, SellerAccessSummary>();
  (listingAssignments ?? []).forEach((assignment) => {
    const sellerAccount = sellerAccountById.get(assignment.seller_account_id);
    if (!sellerAccount) return;

    sellerAccessByListingId.set(assignment.normalized_listing_id, {
      sellerAccountId: sellerAccount.id,
      displayName: sellerAccount.display_name,
      phoneE164: sellerAccount.phone_e164,
      accessCodeExpiresAt:
        accessCodeBySellerAccountId.get(sellerAccount.id)?.expires_at ?? null,
      linkedListingCount: linkedListingCountBySellerAccountId.get(sellerAccount.id) ?? 0,
    });
  });

  const sellerMediaPreviewUrlsById = new Map<string, string>();
  const sellerMediaPaths = (sellerMediaAssets ?? []).map((asset) => asset.storage_path);
  if (sellerMediaPaths.length > 0) {
    const { data: signedUrls, error: signedUrlsError } = await supabase.storage
      .from("seller-listing-media")
      .createSignedUrls(sellerMediaPaths, 60 * 60);
    if (signedUrlsError) throw signedUrlsError;
    signedUrls.forEach((signedUrl, index) => {
      const asset = (sellerMediaAssets ?? [])[index];
      if (asset && signedUrl.signedUrl) sellerMediaPreviewUrlsById.set(asset.id, signedUrl.signedUrl);
    });
  }
  const sellerMediaByListingId = new Map<string, SellerMediaAssetSummary[]>();
  (sellerMediaAssets ?? []).forEach((asset) => {
    const approvalStatus =
      asset.approval_status === "approved" || asset.approval_status === "rejected"
        ? asset.approval_status
        : "pending";
    const mappedAsset: SellerMediaAssetSummary = {
      id: asset.id,
      approvalStatus,
      isPreferredMain: asset.is_preferred_main,
      originalFilename: asset.original_filename,
      previewUrl: sellerMediaPreviewUrlsById.get(asset.id) ?? null,
      reviewNote: asset.review_note,
      uploadedAt: asset.uploaded_at,
    };
    sellerMediaByListingId.set(asset.normalized_listing_id, [
      ...(sellerMediaByListingId.get(asset.normalized_listing_id) ?? []),
      mappedAsset,
    ]);
  });

  const sellerUpdateByListingId = new Map<string, SellerUpdateSummary>();
  const listingById = new Map(data.map((listing) => [listing.id, listing]));
  (sellerSubmissions ?? []).forEach((submission) => {
    if (submission.status !== "submitted") return;
    const reviewStatus =
      submission.admin_review_status === "approved" || submission.admin_review_status === "rejected"
        ? submission.admin_review_status
        : "pending";
    sellerUpdateByListingId.set(submission.normalized_listing_id, {
      reviewStatus,
      hasBuyerFacingChanges: hasSellerSubmissionBuyerFacingChanges(
        listingById.get(submission.normalized_listing_id) ?? {},
        submission,
      ),
      reviewNote: submission.admin_review_note,
      pendingReviewAt: submission.pending_review_at,
      submittedAt: submission.submitted_at,
    });
  });

  return data
    .filter((listing) => !HIDDEN_ADMIN_TEST_SOURCES.has(listing.listing_sources.source_name))
    .map((listing) => {
      const adminSourceContactName = listing.raw_listings?.raw_seller_label ?? null;
      const adminSourceContact = listing.raw_listings?.raw_contact_text ?? null;
      const buyerVisibilityReason = listing.buyer_visibility_reason;

      return {
        id: listing.id,
        source: listing.listing_sources.source_name,
        sourceListingId: listing.source_listing_id ?? "Unavailable",
        sourceUrl: listing.source_listing_url,
        sourceMissingAt: listing.source_missing_at,
        adminSourceContactName,
        adminSourceContact,
        title: listing.display_name || listing.title || "Untitled listing",
        priceAmount: listing.price_amount,
        year: listing.year,
        brand: listing.brand_name,
        model: listing.model_name,
        availabilityStatus: listing.availability_status,
        recommendationState: listing.recommendation_state,
        reviewStatus: listing.review_status,
        workflowStatus: isListingWorkflowStatus(listing.workflow_status)
          ? listing.workflow_status
          : "imported",
        sellerAgreementConfirmed:
          latestWorkflowEventByListingId.get(listing.id)?.seller_contact_outcome ===
          "agreed_assets_pending",
        sellerAccess: sellerAccessByListingId.get(listing.id) ?? null,
        sellerMediaAssets: sellerMediaByListingId.get(listing.id) ?? [],
        sellerUpdate: sellerUpdateByListingId.get(listing.id) ?? null,
        expectedAssetsAt:
          latestWorkflowEventByListingId.get(listing.id)?.expected_assets_at ?? null,
        followUpAt: latestWorkflowEventByListingId.get(listing.id)?.follow_up_at ?? null,
        buyerVisible: listing.is_buyer_visible,
        normalizationConfidence: listing.normalization_confidence,
        buyerVisibilityReason,
        systemDoubtNote: buildSystemDoubtNote({
          adminSourceContact,
          adminSourceContactName,
          buyerVisibilityReason,
          normalizationConfidence: listing.normalization_confidence,
          recommendationState: listing.recommendation_state,
          reviewStatus: listing.review_status,
          sourceMissingAt: listing.source_missing_at,
          year: listing.year,
        }),
        adminReviewImageUrl: getPrimaryNormalizedImageUrl(
          listing.normalized_listing_images,
        ),
        imageDecision: decideListingImage({
          hasSourceImage: listing.normalized_listing_images.length > 0,
          sourceImagesAllowedForPreview: listing.source_images_allowed_for_preview,
        }),
        fetchedAt: listing.raw_listings?.fetched_at ?? null,
        sourcePostedAt: listing.raw_listings?.source_posted_at ?? null,
        sourcePostedText: listing.raw_listings?.source_posted_text ?? null,
        sourceRefreshedAt: listing.raw_listings?.source_refreshed_at ?? null,
        sourceRefreshedText: listing.raw_listings?.source_refreshed_text ?? null,
        sourceFeatures: listing.raw_listings?.raw_features_text ?? null,
        sourceAdditionalInfo: listing.raw_listings?.raw_description ?? null,
        colour: listing.colour,
        engineSize: listing.engine_size,
        plateSeries: listing.plate_series,
      };
    });
}

const ADMIN_INGESTION_SOURCES = new Set(["TriniCarsForSale"]);

export async function getDatabaseIngestionOperations(): Promise<{
  sources: DatabaseIngestionSource[];
  runs: DatabaseIngestionRun[];
}> {
  const supabase = createLocalAdminClient();
  const { data: sources, error: sourcesError } = await supabase
    .from("listing_sources")
    .select(
      "id, source_name, source_type, base_url, ingestion_enabled, ingestion_mode, scheduled_run_time",
    )
    .order("source_name");

  if (sourcesError) throw sourcesError;

  const visibleSources = (sources ?? []).filter((source) =>
    ADMIN_INGESTION_SOURCES.has(source.source_name),
  );
  const sourceIds = visibleSources.map((source) => source.id);
  const { data: previewListings, error: previewListingsError } = sourceIds.length
    ? await supabase
        .from("normalized_listings")
        .select(
          "listing_source_id, title, created_at, source_images_allowed_for_preview, normalized_listing_images(display_url, display_order, preview_allowed)",
        )
        .in("listing_source_id", sourceIds)
        .eq("source_images_allowed_for_preview", true)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [], error: null };

  if (previewListingsError) throw previewListingsError;

  const sourcePreviews = new Map<string, { imageUrl: string; title: string }>();
  for (const listing of previewListings ?? []) {
    if (!listing.listing_source_id) continue;
    if (sourcePreviews.has(listing.listing_source_id)) continue;

    const imageUrl = getPrimaryNormalizedImageUrl(
      listing.normalized_listing_images
        .filter((image) => image.preview_allowed)
        .map((image) => ({
          display_url: image.display_url,
          display_order: image.display_order,
        })),
    );
    if (imageUrl) {
      sourcePreviews.set(listing.listing_source_id, {
        imageUrl,
        title: listing.title ?? "Imported source listing",
      });
    }
  }

  const { data: importedListings, error: importedListingsError } = sourceIds.length
    ? await supabase
        .from("normalized_listings")
        .select("listing_source_id")
        .in("listing_source_id", sourceIds)
        .eq("workflow_status", "imported")
    : { data: [], error: null };

  if (importedListingsError) throw importedListingsError;

  const sourcesWithImportedListings = new Set(
    (importedListings ?? [])
      .map((listing) => listing.listing_source_id)
      .filter((sourceId): sourceId is string => sourceId !== null),
  );

  const { data: runs, error: runsError } = sourceIds.length
    ? await supabase
        .from("ingestion_runs")
        .select(
          "id, started_at, finished_at, status, listings_fetched, listings_normalized, parser_errors, duplicate_warnings, manual_import_type, source_listing_date, source_listings_found, source_listing_ids, listing_sources!inner(source_name)",
        )
        .in("listing_source_id", sourceIds)
        .order("started_at", { ascending: false })
        .limit(20)
    : { data: [], error: null };

  if (runsError) throw runsError;

  return {
    sources: visibleSources.map((source) => {
      const preview = sourcePreviews.get(source.id);
      return {
        id: source.id,
        sourceName: source.source_name,
        sourceType: source.source_type,
        baseUrl: source.base_url,
        ingestionEnabled: source.ingestion_enabled,
        ingestionMode:
          source.ingestion_mode === "automatic_daily" ? "automatic_daily" : "manual",
        scheduledRunTime: source.scheduled_run_time,
        adminPreviewImageUrl: preview?.imageUrl ?? null,
        adminPreviewListingTitle: preview?.title ?? null,
        hasImportedListings: sourcesWithImportedListings.has(source.id),
      };
    }),
    runs: (runs ?? []).map((run) => ({
      id: run.id,
      source: run.listing_sources.source_name,
      startedAt: run.started_at,
      finishedAt: run.finished_at,
      status: run.status,
      listingsFetched: run.listings_fetched,
      listingsNormalized: run.listings_normalized,
      parserErrors: run.parser_errors,
      duplicateWarnings: run.duplicate_warnings,
      manualImportType:
        run.manual_import_type === "test" || run.manual_import_type === "full"
          ? run.manual_import_type
          : null,
      sourceListingDate: run.source_listing_date,
      sourceListingsFound: run.source_listings_found,
      sourceListingIds: readSourceListingIds(run.source_listing_ids),
    })),
  };
}

export async function getDatabaseAdminDashboardMetrics(): Promise<DatabaseAdminDashboardMetrics> {
  const supabase = createLocalAdminClient();
  const { data: listingRows, error: listingsError } = await supabase
    .from("normalized_listings")
    .select(
      "id, display_name, title, price_amount, is_negotiable, year, brand_name, model_name, trim_name, mileage_value, fuel_type, transmission_type, body_type, location_label, public_contact_name, public_contact_phone, colour, engine_size, plate_series, availability_status, review_status, workflow_status, is_buyer_visible, source_missing_at, raw_listings(fetched_at), listing_sources!inner(source_name)",
    )
    .order("created_at", { ascending: false });

  if (listingsError) throw listingsError;

  const visibleListings = (listingRows ?? []).filter(
    (listing) => !HIDDEN_ADMIN_TEST_SOURCES.has(listing.listing_sources.source_name),
  );
  const listingIds = visibleListings.map((listing) => listing.id);
  const { data: workflowEvents, error: workflowEventsError } = listingIds.length
    ? await supabase
        .from("listing_workflow_events")
        .select("normalized_listing_id, seller_contact_outcome, occurred_at")
        .in("normalized_listing_id", listingIds)
        .order("occurred_at", { ascending: false })
    : { data: [], error: null };

  if (workflowEventsError) throw workflowEventsError;

  const latestWorkflowEventByListingId = new Map<string, (typeof workflowEvents)[number]>();
  (workflowEvents ?? []).forEach((event) => {
    if (!latestWorkflowEventByListingId.has(event.normalized_listing_id)) {
      latestWorkflowEventByListingId.set(event.normalized_listing_id, event);
    }
  });

  const listings = visibleListings.map((listing) => ({
    id: listing.id,
    availabilityStatus: listing.availability_status,
    buyerVisible: listing.is_buyer_visible,
    fetchedAt: listing.raw_listings?.fetched_at ?? null,
    reviewStatus: listing.review_status,
    sellerAgreementConfirmed:
      latestWorkflowEventByListingId.get(listing.id)?.seller_contact_outcome ===
      "agreed_assets_pending",
    sourceMissingAt: listing.source_missing_at,
    workflowStatus: isListingWorkflowStatus(listing.workflow_status)
      ? listing.workflow_status
      : "imported",
  }));

  const { data: sellerSubmissions, error: sellerSubmissionsError } = listingIds.length
    ? await supabase
        .from("seller_listing_submissions")
        .select("normalized_listing_id, status, admin_review_status, display_name, price_amount, is_negotiable, year, brand_name, model_name, trim_name, colour, engine_size, plate_series, mileage_value, transmission_type, fuel_type, body_type, location_label, public_contact_name, public_contact_phone")
        .in("normalized_listing_id", listingIds)
    : { data: [], error: null };

  if (sellerSubmissionsError) throw sellerSubmissionsError;

  const { data: sellerMediaAssets, error: sellerMediaAssetsError } = listingIds.length
    ? await supabase
        .from("seller_listing_media_assets")
        .select("normalized_listing_id, approval_status")
        .in("normalized_listing_id", listingIds)
    : { data: [], error: null };

  if (sellerMediaAssetsError) throw sellerMediaAssetsError;

  const workflowStatusByListingId = new Map(
    listings.map((listing) => [listing.id, listing.workflowStatus]),
  );
  const visibleListingById = new Map(visibleListings.map((listing) => [listing.id, listing]));
  const sellerUpdatesAwaitingReview = (sellerSubmissions ?? []).filter(
    (submission) =>
      submission.status === "submitted" &&
      submission.admin_review_status === "pending" &&
      workflowStatusByListingId.get(submission.normalized_listing_id) === "live" &&
      hasSellerSubmissionBuyerFacingChanges(
        visibleListingById.get(submission.normalized_listing_id) ?? {},
        submission,
      ),
  ).length;
  const sellerPhotosAwaitingReview = new Set(
    (sellerMediaAssets ?? [])
      .filter(
        (asset) =>
          asset.approval_status === "pending" &&
          workflowStatusByListingId.get(asset.normalized_listing_id) === "assets_received",
      )
      .map((asset) => asset.normalized_listing_id),
  ).size;

  const { data: sources, error: sourcesError } = await supabase
    .from("listing_sources")
    .select("id, source_name")
    .order("source_name");

  if (sourcesError) throw sourcesError;

  const sourceIds = (sources ?? [])
    .filter((source) => ADMIN_INGESTION_SOURCES.has(source.source_name))
    .map((source) => source.id);
  const { data: runs, error: runsError } = sourceIds.length
    ? await supabase
        .from("ingestion_runs")
        .select(
          "id, started_at, finished_at, status, listings_fetched, listings_normalized, parser_errors, duplicate_warnings, manual_import_type, source_listing_date, source_listings_found, source_listing_ids, listing_sources!inner(source_name)",
        )
        .in("listing_source_id", sourceIds)
        .order("started_at", { ascending: false })
        .limit(20)
    : { data: [], error: null };

  if (runsError) throw runsError;

  const ingestionRuns: DatabaseIngestionRun[] = (runs ?? []).map((run) => ({
    id: run.id,
    source: run.listing_sources.source_name,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
    status: run.status,
    listingsFetched: run.listings_fetched,
    listingsNormalized: run.listings_normalized,
    parserErrors: run.parser_errors,
    duplicateWarnings: run.duplicate_warnings,
    manualImportType:
      run.manual_import_type === "test" || run.manual_import_type === "full"
        ? run.manual_import_type
        : null,
    sourceListingDate: run.source_listing_date,
    sourceListingsFound: run.source_listings_found,
    sourceListingIds: readSourceListingIds(run.source_listing_ids),
  }));

  return {
    latestIngestionRun: ingestionRuns[0] ?? null,
    newImportsToday: listings.filter(
      (listing) =>
        listing.fetchedAt !== null &&
        getPortOfSpainDateKey(listing.fetchedAt) === getPortOfSpainDateKey(new Date()),
    ).length,
    sellerPhotosAwaitingReview,
    sellerUpdatesAwaitingReview,
    workflowCounts: {
      assetsReceived: listings.filter(
        (listing) => getListingWorkflowPipelineStage(listing) === "assets_received",
      ).length,
      imported: listings.filter(
        (listing) => getListingWorkflowPipelineStage(listing) === "imported",
      ).length,
      live: listings.filter(
        (listing) => listing.workflowStatus === "live" && listing.buyerVisible,
      ).length,
      sellerContacted: listings.filter(
        (listing) => getListingWorkflowPipelineStage(listing) === "seller_contacted",
      ).length,
      verified: listings.filter(
        (listing) => getListingWorkflowPipelineStage(listing) === "verified",
      ).length,
    },
  };
}

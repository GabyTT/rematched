import "server-only";

import { createLocalAdminClient } from "@/lib/adminDatabase";
import { isListingWorkflowStatus, type ListingWorkflowStatus } from "@/lib/listingWorkflow";
import { hasSellerSubmissionBuyerFacingChanges } from "@/lib/sellerSubmissionReview";

export type SellerListingDetails = {
  additionalInfo: string;
  bodyType: string;
  brand: string;
  colour: string;
  contactName: string;
  contactPhone: string;
  engineSize: string;
  features: string[];
  fuelType: string;
  location: string;
  mileage: number | null;
  model: string;
  plateSeries: string;
  priceAmount: number | null;
  isNegotiable: boolean;
  title: string;
  transmission: string;
  trim: string;
  year: number | null;
};

export type SellerPortalMediaAsset = {
  id: string;
  approvalStatus: "pending" | "approved" | "rejected";
  isPreferredMain: boolean;
  originalFilename: string;
  previewUrl: string | null;
  reviewNote: string | null;
};

export type SellerPortalListing = {
  id: string;
  title: string;
  priceAmount: number | null;
  year: number | null;
  brand: string | null;
  model: string | null;
  sellerStatus: "draft" | "action_needed" | "photo_approval_pending" | "live";
  details: SellerListingDetails;
  mediaAssets: SellerPortalMediaAsset[];
  submissionStatus: "not_started" | "draft" | "submitted";
  submittedAt: string | null;
  publicationConsentAt: string | null;
  adminReviewStatus: "pending" | "approved" | "rejected" | null;
  adminReviewNote: string | null;
};

export type SellerPortalData = {
  displayName: string | null;
  listings: SellerPortalListing[];
};

function getSellerStatus(workflowStatus: string): SellerPortalListing["sellerStatus"] {
  const status: ListingWorkflowStatus = isListingWorkflowStatus(workflowStatus)
    ? workflowStatus
    : "seller_contacted";

  if (status === "live") return "live";
  if (status === "assets_received") return "photo_approval_pending";
  if (status === "seller_contacted") return "action_needed";
  return "draft";
}

function cleanString(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function stringFromPayload(payload: unknown, key: string) {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") return "";
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function featuresFromValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function formatLocalPhone(value: string) {
  const match = /^\+1868(\d{3})(\d{4})$/.exec(value);
  return match ? `868-${match[1]}-${match[2]}` : value;
}

export async function getSellerPortalData(
  sellerAccountId: string,
): Promise<SellerPortalData | null> {
  const supabase = createLocalAdminClient();
  const { data: sellerAccount, error: sellerAccountError } = await supabase
    .from("seller_accounts")
    .select("id, display_name, phone_e164")
    .eq("id", sellerAccountId)
    .maybeSingle();

  if (sellerAccountError) throw sellerAccountError;
  if (!sellerAccount) return null;

  const { data: assignments, error: assignmentsError } = await supabase
    .from("seller_listing_assignments")
    .select("normalized_listing_id")
    .eq("seller_account_id", sellerAccountId);

  if (assignmentsError) throw assignmentsError;

  const listingIds = assignments.map((assignment) => assignment.normalized_listing_id);
  if (listingIds.length === 0) {
    return { displayName: sellerAccount.display_name, listings: [] };
  }

  const [
    { data: listings, error: listingsError },
    { data: submissions, error: submissionsError },
    { data: mediaAssets, error: mediaAssetsError },
  ] =
    await Promise.all([
      supabase
        .from("normalized_listings")
        .select(
          "id, raw_listing_id, display_name, title, price_amount, year, brand_name, model_name, trim_name, colour, engine_size, plate_series, is_negotiable, mileage_value, fuel_type, transmission_type, body_type, location_label, workflow_status",
        )
        .in("id", listingIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("seller_listing_submissions")
        .select("*")
        .eq("seller_account_id", sellerAccountId)
        .in("normalized_listing_id", listingIds),
      supabase
        .from("seller_listing_media_assets")
        .select("id, normalized_listing_id, storage_path, original_filename, approval_status, is_preferred_main, review_note, uploaded_at")
        .eq("seller_account_id", sellerAccountId)
        .in("normalized_listing_id", listingIds)
        .order("uploaded_at", { ascending: false }),
    ]);

  if (listingsError) throw listingsError;
  if (submissionsError) throw submissionsError;
  if (mediaAssetsError) throw mediaAssetsError;

  const rawListingIds = listings.flatMap((listing) => (listing.raw_listing_id ? [listing.raw_listing_id] : []));
  const { data: rawListings, error: rawListingsError } = rawListingIds.length
    ? await supabase.from("raw_listings").select("id, raw_payload, raw_features_text").in("id", rawListingIds)
    : { data: [], error: null };
  if (rawListingsError) throw rawListingsError;

  const submissionsByListing = new Map(
    submissions.map((submission) => [submission.normalized_listing_id, submission]),
  );
  const rawListingsById = new Map(rawListings.map((rawListing) => [rawListing.id, rawListing]));
  const mediaPreviewUrlsById = new Map<string, string>();
  const mediaPaths = (mediaAssets ?? []).map((asset) => asset.storage_path);
  if (mediaPaths.length > 0) {
    const { data: signedUrls, error: signedUrlsError } = await supabase.storage
      .from("seller-listing-media")
      .createSignedUrls(mediaPaths, 60 * 60);
    if (signedUrlsError) throw signedUrlsError;
    signedUrls.forEach((signedUrl, index) => {
      if (signedUrl.signedUrl) mediaPreviewUrlsById.set((mediaAssets ?? [])[index].id, signedUrl.signedUrl);
    });
  }
  const mediaByListingId = new Map<string, SellerPortalMediaAsset[]>();
  (mediaAssets ?? []).forEach((asset) => {
    const approvalStatus =
      asset.approval_status === "approved" || asset.approval_status === "rejected"
        ? asset.approval_status
        : "pending";
    const mappedAsset: SellerPortalMediaAsset = {
      id: asset.id,
      approvalStatus,
      isPreferredMain: asset.is_preferred_main,
      originalFilename: asset.original_filename,
      previewUrl: mediaPreviewUrlsById.get(asset.id) ?? null,
      reviewNote: asset.review_note,
    };
    mediaByListingId.set(asset.normalized_listing_id, [
      ...(mediaByListingId.get(asset.normalized_listing_id) ?? []),
      mappedAsset,
    ]);
  });

  return {
    displayName: sellerAccount.display_name,
    listings: listings.map((listing) => {
      const submission = submissionsByListing.get(listing.id);
      const rawListing = listing.raw_listing_id ? rawListingsById.get(listing.raw_listing_id) : null;
      const rawPayload = rawListing?.raw_payload ?? null;
      const title = cleanString(submission?.display_name) || listing.display_name || listing.title || "Your car";
      const details: SellerListingDetails = {
        additionalInfo: cleanString(submission?.additional_info),
        bodyType: cleanString(submission?.body_type) || cleanString(listing.body_type),
        brand: cleanString(submission?.brand_name) || cleanString(listing.brand_name),
        colour: cleanString(submission?.colour) || stringFromPayload(rawPayload, "colour"),
        contactName: cleanString(submission?.public_contact_name) || cleanString(sellerAccount.display_name),
        contactPhone: cleanString(submission?.public_contact_phone) || formatLocalPhone(sellerAccount.phone_e164),
        engineSize: cleanString(submission?.engine_size) || stringFromPayload(rawPayload, "engine_size"),
        features: featuresFromValue(submission?.features || rawListing?.raw_features_text),
        fuelType: cleanString(submission?.fuel_type) || cleanString(listing.fuel_type),
        location: cleanString(submission?.location_label) || cleanString(listing.location_label),
        mileage: submission?.mileage_value ?? listing.mileage_value,
        model: cleanString(submission?.model_name) || cleanString(listing.model_name),
        plateSeries: cleanString(submission?.plate_series) || cleanString(listing.plate_series),
        priceAmount: submission?.price_amount ?? listing.price_amount,
        isNegotiable: submission?.is_negotiable ?? listing.is_negotiable,
        title,
        transmission: cleanString(submission?.transmission_type) || cleanString(listing.transmission_type),
        trim: cleanString(submission?.trim_name) || cleanString(listing.trim_name),
        year: submission?.year ?? listing.year,
      };
      const hasPendingBuyerFacingUpdate =
        listing.workflow_status === "live" &&
        submission?.status === "submitted" &&
        submission.admin_review_status === "pending" &&
        hasSellerSubmissionBuyerFacingChanges(listing, submission);

      return {
        id: listing.id,
        title,
        priceAmount: details.priceAmount,
        year: details.year,
        brand: details.brand || null,
        model: details.model || null,
        sellerStatus: getSellerStatus(listing.workflow_status),
        details,
        mediaAssets: mediaByListingId.get(listing.id) ?? [],
        submissionStatus:
          submission?.status === "submitted" ? "submitted" : submission?.status === "draft" ? "draft" : "not_started",
        submittedAt: submission?.submitted_at ?? null,
        publicationConsentAt: submission?.publication_consent_accepted_at ?? null,
        adminReviewStatus:
          submission?.status === "submitted"
            ? submission.admin_review_status === "approved" || submission.admin_review_status === "rejected"
              ? submission.admin_review_status
              : hasPendingBuyerFacingUpdate
                ? "pending"
                : "approved"
            : null,
        adminReviewNote: submission?.admin_review_note ?? null,
      };
    }),
  };
}

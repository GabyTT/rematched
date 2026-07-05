"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CircleAlert,
  Database,
  FileSearch,
  GitCompareArrows,
  RefreshCw,
} from "lucide-react";

import { AdminListingActions } from "@/components/admin/AdminListingActions";
import { useAdminIngestion } from "@/components/admin/AdminIngestionProvider";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminBadge,
  AdminKeyValueGrid,
  AdminSection,
} from "@/components/admin/AdminUI";
import {
  recommendationReasonLabels,
  recommendationEligibilityLabels,
  reviewReasonLabels,
} from "@/lib/adminIngestion";

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-TT", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not available";

const formatPrice = (value: number | null) =>
  value === null
    ? "Missing"
    : `TT$${new Intl.NumberFormat("en-US").format(value)}`;

const formatNumber = (value: number | null) =>
  value === null ? "Missing" : new Intl.NumberFormat("en-US").format(value);

export default function AdminListingDetailPage() {
  const params = useParams<{ listingId: string }>();
  const listingId = Array.isArray(params.listingId)
    ? params.listingId[0]
    : params.listingId;
  const { getAdminListingDetail } = useAdminIngestion();
  const detail = listingId ? getAdminListingDetail(listingId) : null;
  const recommendationTone =
    detail?.adminListing?.recommendationEligibility === "eligible"
      ? "good"
      : detail?.adminListing?.recommendationEligibility === "limited"
        ? "warn"
        : detail?.adminListing?.recommendationEligibility === "review_required"
          ? "warn"
          : "bad";

  if (!detail || !detail.adminListing || !detail.rawListing) {
    return (
      <AdminShell
        title="Listing detail"
        description="This listing could not be found in the current mock ingestion workspace."
      >
        <div className="flex items-center">
          <Link
            href="/admin/listings"
            className="inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/8"
          >
            <ArrowLeft size={16} strokeWidth={2.2} className="mr-2.5" />
            Back to listings
          </Link>
        </div>
      </AdminShell>
    );
  }

  const {
    adminListing,
    duplicateWarnings,
    ingestionRun,
    normalizedListing,
    rawListing,
    reviewRecord,
  } = detail;

  return (
    <AdminShell
      title="Listing detail"
      description="A single-record admin view showing how one imported listing moves from raw source data into normalized inventory, review workflow, and recommendation eligibility."
    >
      <div className="flex items-center">
        <Link
          href="/admin/listings"
          className="inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/8"
        >
          <ArrowLeft size={16} strokeWidth={2.2} className="mr-2.5" />
          Back to listings
        </Link>
      </div>

      <AdminSection
        title={adminListing.title}
        description="Use this page to compare raw source input against normalized output, review state, duplicate pressure, and source attribution concerns."
        icon={FileSearch}
      >
        <div className="flex flex-wrap gap-2">
          <AdminBadge
            label={adminListing.source}
            tone="neutral"
          />
          <AdminBadge
            label={adminListing.availabilityStatus}
            tone={
              adminListing.availabilityStatus === "active"
                ? "good"
                : adminListing.availabilityStatus === "stale"
                  ? "warn"
                  : "neutral"
            }
          />
          <AdminBadge
            label={
              recommendationEligibilityLabels[
                adminListing.recommendationEligibility
              ]
            }
            tone={recommendationTone}
          />
          <AdminBadge
            label={adminListing.reviewStatus.replace("_", " ")}
            tone={
              adminListing.reviewStatus === "approved"
                ? "good"
                : adminListing.reviewStatus === "pending"
                  ? "neutral"
                  : "warn"
            }
          />
        </div>
      </AdminSection>

      <AdminSection
        title="Admin actions"
        description="These actions simulate the first review controls an admin will need when deciding whether a listing should be trusted in discovery, limited, hidden, or pushed back for further review."
        icon={CircleAlert}
      >
        <AdminListingActions listingId={listingId} />
      </AdminSection>

      <AdminSection
        title="Recommendation readiness"
        description="This layer expresses whether the listing is trustworthy and complete enough for buyer-facing discovery, and why."
        icon={CircleAlert}
      >
        <AdminKeyValueGrid
          items={[
            {
              label: "Recommendation state",
              value:
                recommendationEligibilityLabels[
                  normalizedListing.recommendationEligibility
                ],
            },
            {
              label: "Buyer-flow relationship",
              value:
                normalizedListing.recommendationEligibility === "eligible"
                  ? "Strong candidate for Discover and future match confidence."
                  : normalizedListing.recommendationEligibility === "limited"
                    ? "Safer for broader exploration than strong recommendation."
                    : normalizedListing.recommendationEligibility === "review_required"
                      ? "Hold for admin review before confident buyer-facing discovery."
                      : "Keep out of buyer-facing discovery until trust improves.",
            },
          ]}
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {normalizedListing.recommendationReasons.length ? (
            normalizedListing.recommendationReasons.map((reason) => (
              <AdminBadge
                key={reason}
                label={recommendationReasonLabels[reason]}
                tone={
                  reason === "missing_critical_fields"
                    ? "bad"
                    : reason === "duplicate_under_review" ||
                        reason === "freshness_untrusted" ||
                        reason === "normalization_uncertain" ||
                        reason === "attribution_review"
                      ? "warn"
                      : "neutral"
                }
              />
            ))
          ) : (
            <AdminBadge label="No limiting factors" tone="good" />
          )}
        </div>
        <div className="mt-5 space-y-3">
          {normalizedListing.confidenceNotes.map((note) => (
            <div
              key={note}
              className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300"
            >
              {note}
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection
        title="Normalized listing"
        description="This is the canonical record the buyer experience would eventually rely on for discovery, recommendation eligibility, and admin decision-making."
        icon={Database}
      >
        <AdminKeyValueGrid
          items={[
            { label: "Display name", value: normalizedListing.displayName },
            { label: "Price amount", value: formatPrice(normalizedListing.priceAmount) },
            { label: "Year", value: normalizedListing.year ?? "Missing" },
            { label: "Brand", value: normalizedListing.brand ?? "Missing" },
            { label: "Model", value: normalizedListing.model ?? "Missing" },
            { label: "Trim", value: normalizedListing.trim ?? "Missing" },
            { label: "Mileage value", value: formatNumber(normalizedListing.mileageValue) },
            { label: "Fuel type", value: normalizedListing.fuelType ?? "Missing" },
            {
              label: "Transmission type",
              value: normalizedListing.transmissionType ?? "Missing",
            },
            { label: "Body type", value: normalizedListing.bodyType ?? "Missing" },
            { label: "Location", value: normalizedListing.locationLabel ?? "Missing" },
            { label: "Seller type", value: normalizedListing.sellerType ?? "Missing" },
            {
              label: "Contact method",
              value: normalizedListing.contactMethod ?? "Missing",
            },
            {
              label: "Import status",
              value: normalizedListing.importStatus ?? "Missing",
            },
            {
              label: "Normalization confidence",
              value: normalizedListing.normalizationConfidence,
            },
            {
              label: "Source attribution required",
              value: normalizedListing.sourceAttributionRequired ? "Yes" : "No",
            },
            {
              label: "Source images allowed for preview",
              value: normalizedListing.sourceImagesAllowedForPreview ? "Yes" : "No",
            },
          ]}
        />
      </AdminSection>

      <AdminSection
        title="Raw source record"
        description="These are the source-native values captured before extraction and normalization. They should remain preserved for traceability and parser debugging."
        icon={RefreshCw}
      >
        <AdminKeyValueGrid
          items={[
            { label: "Source listing ID", value: rawListing.sourceListingId ?? "Missing" },
            {
              label: "Source listing URL",
              value: rawListing.sourceListingUrl ? (
                <a
                  href={rawListing.sourceListingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-white/20 underline-offset-4 transition hover:text-slate-100"
                >
                  Open source record
                </a>
              ) : (
                "Unavailable"
              ),
            },
            { label: "Raw title", value: rawListing.rawTitle },
            { label: "Raw price text", value: rawListing.rawPriceText ?? "Missing" },
            {
              label: "Raw location text",
              value: rawListing.rawLocationText ?? "Missing",
            },
            {
              label: "Raw contact text",
              value: rawListing.rawContactText ?? "Missing",
            },
            {
              label: "Raw seller label",
              value: rawListing.rawSellerLabel ?? "Missing",
            },
            {
              label: "Raw mileage text",
              value: rawListing.rawMileageText ?? "Missing",
            },
            { label: "Raw fuel text", value: rawListing.rawFuelText ?? "Missing" },
            {
              label: "Raw transmission text",
              value: rawListing.rawTransmissionText ?? "Missing",
            },
            { label: "Raw trim text", value: rawListing.rawTrimText ?? "Missing" },
            { label: "Fetched at", value: formatDateTime(rawListing.fetchedAt) },
            {
              label: "Raw description",
              value: rawListing.rawDescription ?? "Missing",
            },
            {
              label: "Raw image URLs",
              value:
                rawListing.rawImageUrls.length > 0
                  ? `${rawListing.rawImageUrls.length} image reference(s)`
                  : "None",
            },
          ]}
        />
      </AdminSection>

      <AdminSection
        title="Review state"
        description="This layer represents the human decision process around missing fields, uncertainty, duplicates, stale inventory, and attribution concerns."
        icon={CircleAlert}
      >
        <AdminKeyValueGrid
          items={[
            {
              label: "Review status",
              value: reviewRecord?.reviewStatus.replace("_", " ") ?? "Pending",
            },
            {
              label: "Assigned queue",
              value: reviewRecord?.assignedQueue ?? "Unassigned",
            },
            {
              label: "Reviewed at",
              value: formatDateTime(reviewRecord?.reviewedAt ?? null),
            },
            {
              label: "Admin note",
              value: reviewRecord?.adminNote ?? "No note yet",
            },
          ]}
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {(reviewRecord?.reviewReasons ?? []).length ? (
            reviewRecord!.reviewReasons.map((reason) => (
              <AdminBadge
                key={reason}
                label={reviewReasonLabels[reason]}
                tone={
                  reason === "image_attribution_concern"
                    ? "bad"
                    : reason === "duplicate_warning" ||
                        reason === "stale_availability" ||
                        reason === "uncertain_normalization"
                      ? "warn"
                      : "neutral"
                }
              />
            ))
          ) : (
            <AdminBadge label="No review flags" tone="good" />
          )}
        </div>
      </AdminSection>

      <AdminSection
        title="Duplicates and ingestion context"
        description="This layer helps admins understand how the listing entered the system and whether it may overlap with other records."
        icon={GitCompareArrows}
      >
        <AdminKeyValueGrid
          items={[
            {
              label: "Ingestion run",
              value: ingestionRun
                ? `${ingestionRun.source} (${ingestionRun.status})`
                : "Unavailable",
            },
            {
              label: "Run started",
              value: ingestionRun ? formatDateTime(ingestionRun.startedAt) : "Unavailable",
            },
            {
              label: "Run finished",
              value: ingestionRun ? formatDateTime(ingestionRun.finishedAt) : "Unavailable",
            },
            {
              label: "Parser errors in run",
              value: ingestionRun ? ingestionRun.parserErrors : "Unavailable",
            },
          ]}
        />
        <div className="mt-5 space-y-4">
          {duplicateWarnings.length ? (
            duplicateWarnings.map((warning) => (
              <article
                key={warning.id}
                className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <AdminBadge label={`Confidence ${Math.round(warning.confidenceScore * 100)}%`} tone="warn" />
                  <AdminBadge label={warning.status} tone="neutral" />
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Possible related listings: {warning.possibleDuplicateListingIds.join(", ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {warning.matchedSignals.map((signal) => (
                    <AdminBadge key={signal} label={signal} tone="neutral" />
                  ))}
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm leading-7 text-slate-300">
              No duplicate warnings are currently attached to this listing.
            </p>
          )}
        </div>
      </AdminSection>
    </AdminShell>
  );
}

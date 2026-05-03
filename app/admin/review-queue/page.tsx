"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminIngestion } from "@/components/admin/AdminIngestionProvider";
import { AdminBadge, AdminSection } from "@/components/admin/AdminUI";
import {
  recommendationEligibilityLabels,
  reviewReasonLabels,
} from "@/lib/adminIngestion";
import Link from "next/link";
import { ScanSearch } from "lucide-react";

export default function AdminReviewQueuePage() {
  const { getReviewQueueListings } = useAdminIngestion();
  const reviewListings = getReviewQueueListings();

  return (
    <AdminShell
      title="Review queue"
      description="Listings that need human review before they can be trusted in the buyer flow. This queue is intentionally centered on missing fields, uncertainty, duplicate pressure, stale freshness, and attribution concerns."
    >
      <AdminSection
        title="Listings needing human review"
        description="This queue reflects the kinds of cases the ingestion notes call out as risky to automate too aggressively. For MVP, these cases should stay visible and explainable."
        icon={ScanSearch}
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {reviewListings.map((listing) => (
            <article
              key={listing.id}
              className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-slate-400">
                    {listing.source}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    <Link
                      href={`/admin/listings/${listing.id}`}
                      className="underline decoration-white/10 underline-offset-4 transition hover:text-slate-100 hover:decoration-white/30"
                    >
                      {listing.title}
                    </Link>
                  </h3>
                </div>
                <AdminBadge
                  label={listing.reviewStatus.replace("_", " ")}
                  tone={listing.reviewStatus === "pending" ? "neutral" : "warn"}
                />
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Price</dt>
                  <dd className="mt-1 text-white">
                    {listing.priceAmount === null
                      ? "Missing"
                      : `TT$${new Intl.NumberFormat("en-US").format(
                          listing.priceAmount,
                        )}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Brand / Model</dt>
                  <dd className="mt-1 text-white">
                    {listing.brand ?? "Missing"} / {listing.model ?? "Missing"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Availability</dt>
                  <dd className="mt-1 text-white">{listing.availabilityStatus}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Recommendation</dt>
                  <dd className="mt-1 text-white">
                    {recommendationEligibilityLabels[listing.recommendationEligibility]}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                {listing.reviewReasons.map((reason) => (
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
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-400">
                This listing stays visible here until an admin decides whether it
                should be normalized more confidently, demoted, hidden from
                recommendation surfaces, or kept source-attributed with limits.
              </p>
            </article>
          ))}
        </div>
      </AdminSection>
    </AdminShell>
  );
}

"use client";

import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminIngestion } from "@/components/admin/AdminIngestionProvider";
import {
  AdminBadge,
  AdminSection,
} from "@/components/admin/AdminUI";
import {
  recommendationReasonLabels,
  recommendationEligibilityLabels,
} from "@/lib/adminIngestion";
import { ClipboardList } from "lucide-react";

const formatPrice = (value: number | null) =>
  value === null
    ? "Missing"
    : `TT$${new Intl.NumberFormat("en-US").format(value)}`;

export default function AdminListingsPage() {
  const { adminListings } = useAdminIngestion();
  const recommendationTone = (value: (typeof adminListings)[number]["recommendationEligibility"]) =>
    value === "eligible"
      ? "good"
      : value === "limited"
        ? "warn"
        : value === "review_required"
          ? "warn"
          : "bad";

  return (
    <AdminShell
      title="Imported listings"
      description="Mock imported listings for the ingestion admin foundation. This view is designed to show the normalized record that will eventually feed Discover, recommendation eligibility, and review decisions."
    >
      <AdminSection
        title="Listings table"
        description="This table is intentionally shaped around the fields most relevant to ingestion monitoring, recommendation readiness, and source attribution."
        icon={ClipboardList}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Title</th>
                <th className="px-3 py-2 font-semibold">Price</th>
                <th className="px-3 py-2 font-semibold">Year</th>
                <th className="px-3 py-2 font-semibold">Brand</th>
                <th className="px-3 py-2 font-semibold">Model</th>
                <th className="px-3 py-2 font-semibold">Availability</th>
                <th className="px-3 py-2 font-semibold">Recommendation</th>
                <th className="px-3 py-2 font-semibold">Review</th>
                <th className="px-3 py-2 font-semibold">Source URL</th>
              </tr>
            </thead>
            <tbody>
              {adminListings.map((listing) => (
                <tr
                  key={listing.id}
                  className="rounded-[20px] border border-white/8 bg-white/[0.03] text-sm text-slate-200 shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
                >
                  <td className="rounded-l-[20px] px-3 py-4 align-top">
                    <div className="font-semibold text-white">{listing.source}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {listing.sourceListingId}
                    </div>
                  </td>
                  <td className="px-3 py-4 align-top">
                    <Link
                      href={`/admin/listings/${listing.id}`}
                      className="font-semibold text-white underline decoration-white/10 underline-offset-4 transition hover:text-slate-100 hover:decoration-white/30"
                    >
                      {listing.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {listing.duplicateWarning ? (
                        <AdminBadge label="Duplicate" tone="warn" />
                      ) : null}
                      {listing.imageAttributionConcern ? (
                        <AdminBadge label="Attribution" tone="bad" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-4 align-top">{formatPrice(listing.priceAmount)}</td>
                  <td className="px-3 py-4 align-top">
                    {listing.year ?? "Missing"}
                  </td>
                  <td className="px-3 py-4 align-top">
                    {listing.brand ?? "Missing"}
                  </td>
                  <td className="px-3 py-4 align-top">
                    {listing.model ?? "Missing"}
                  </td>
                  <td className="px-3 py-4 align-top">
                    <AdminBadge
                      label={listing.availabilityStatus}
                      tone={
                        listing.availabilityStatus === "active"
                          ? "good"
                          : listing.availabilityStatus === "stale"
                            ? "warn"
                            : "neutral"
                      }
                    />
                  </td>
                  <td className="px-3 py-4 align-top">
                    <AdminBadge
                      label={
                        recommendationEligibilityLabels[
                          listing.recommendationEligibility
                        ]
                      }
                      tone={recommendationTone(listing.recommendationEligibility)}
                    />
                    {listing.recommendationReasons.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {listing.recommendationReasons.slice(0, 2).map((reason) => (
                          <AdminBadge
                            key={reason}
                            label={recommendationReasonLabels[reason]}
                            tone="neutral"
                          />
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 align-top">
                    <AdminBadge
                      label={listing.reviewStatus.replace("_", " ")}
                      tone={
                        listing.reviewStatus === "approved"
                          ? "good"
                          : listing.reviewStatus === "pending"
                            ? "neutral"
                            : "warn"
                      }
                    />
                  </td>
                  <td className="rounded-r-[20px] px-3 py-4 align-top">
                    <div className="flex flex-col items-start gap-2">
                      <Link
                        href={`/admin/listings/${listing.id}`}
                        className="text-sm font-semibold text-slate-100 underline decoration-white/20 underline-offset-4 transition hover:text-white"
                      >
                        View detail
                      </Link>
                      {listing.sourceUrl ? (
                        <a
                          href={listing.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-300 underline decoration-white/10 underline-offset-4 transition hover:text-white"
                        >
                          Open source
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500">Unavailable</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>
    </AdminShell>
  );
}

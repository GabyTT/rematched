"use client";

import { useMemo } from "react";
import { Ban, CheckCircle2, RotateCcw, ScanSearch, TimerReset } from "lucide-react";

import { useAdminIngestion } from "@/components/admin/AdminIngestionProvider";
import { AdminBadge } from "@/components/admin/AdminUI";
import { recommendationEligibilityLabels } from "@/lib/adminIngestion";

type AdminListingActionsProps = {
  listingId: string;
};

export function AdminListingActions({ listingId }: AdminListingActionsProps) {
  const {
    getAdminListingDetail,
    lastActionByListingId,
    resetListingState,
    updateListingState,
  } = useAdminIngestion();
  const detail = getAdminListingDetail(listingId);
  const availabilityStatus = detail?.adminListing?.availabilityStatus ?? "inactive";
  const recommendationEligibility =
    detail?.adminListing?.recommendationEligibility ?? "limited";
  const reviewStatus = detail?.adminListing?.reviewStatus ?? "pending";
  const lastAction = lastActionByListingId[listingId] ?? "No action taken yet";

  const availabilityTone = useMemo(() => {
    if (availabilityStatus === "active") {
      return "good" as const;
    }

    if (availabilityStatus === "stale") {
      return "warn" as const;
    }

    return "neutral" as const;
  }, [availabilityStatus]);

  const recommendationTone = useMemo(() => {
    if (recommendationEligibility === "eligible") {
      return "good" as const;
    }

    if (recommendationEligibility === "limited") {
      return "warn" as const;
    }

    if (recommendationEligibility === "review_required") {
      return "warn" as const;
    }

    return "bad" as const;
  }, [recommendationEligibility]);

  const reviewTone = useMemo(() => {
    if (reviewStatus === "approved") {
      return "good" as const;
    }

    if (reviewStatus === "pending") {
      return "neutral" as const;
    }

    return "warn" as const;
  }, [reviewStatus]);

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
      <div className="flex flex-wrap gap-2">
        <AdminBadge label={availabilityStatus} tone={availabilityTone} />
        <AdminBadge
          label={recommendationEligibilityLabels[recommendationEligibility]}
          tone={recommendationTone}
        />
        <AdminBadge
          label={reviewStatus.replace("_", " ")}
          tone={reviewTone}
        />
      </div>

      <p className="mt-4 text-base leading-7 text-slate-300">
        These actions currently update shared mock admin state across the
        dashboard, listings, and review queue. They let us shape the workflow
        before persistence and real review tooling are connected.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            updateListingState(listingId, {
              availabilityStatus: "active",
              recommendationEligibility: "eligible",
              reviewStatus: "approved",
              lastAction: "Approved for buyer discovery",
            });
          }}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/12 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/18"
        >
          <CheckCircle2 size={16} strokeWidth={2.2} className="mr-2.5" />
          Approve
        </button>

        <button
          type="button"
          onClick={() => {
            updateListingState(listingId, {
              recommendationEligibility: "hidden",
              reviewStatus: "needs_review",
              lastAction: "Hidden from buyer-facing recommendation surfaces",
            });
          }}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/12 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/18"
        >
          <Ban size={16} strokeWidth={2.2} className="mr-2.5" />
          Hide
        </button>

        <button
          type="button"
          onClick={() => {
            updateListingState(listingId, {
              availabilityStatus: "stale",
              recommendationEligibility:
                recommendationEligibility === "hidden" ? "hidden" : "limited",
              reviewStatus: "needs_review",
              lastAction: "Marked stale and limited for discovery",
            });
          }}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/12 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/18"
        >
          <TimerReset size={16} strokeWidth={2.2} className="mr-2.5" />
          Mark stale
        </button>

        <button
          type="button"
          onClick={() => {
            updateListingState(listingId, {
              recommendationEligibility: "review_required",
              reviewStatus: "needs_review",
              lastAction: "Returned to review queue",
            });
          }}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.09]"
        >
          <ScanSearch size={16} strokeWidth={2.2} className="mr-2.5" />
          Needs review
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-black/10 px-4 py-3">
        <p className="text-base text-slate-300">
          <span className="font-semibold text-white">Latest mock action:</span>{" "}
          {lastAction}
        </p>
        <button
          type="button"
          onClick={() => {
            resetListingState(listingId);
          }}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"
        >
          <RotateCcw size={15} strokeWidth={2.2} className="mr-2.5" />
          Reset
        </button>
      </div>
    </div>
  );
}

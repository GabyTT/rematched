"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  adminIngestionRuns,
  adminListings as baseAdminListings,
  getAdminListingDetail as getBaseAdminListingDetail,
  type AdminListing,
  type ListingAvailabilityStatus,
  type RecommendationEligibility,
  type ReviewStatus,
} from "@/lib/adminIngestion";

type ListingStateOverride = {
  availabilityStatus: ListingAvailabilityStatus;
  recommendationEligibility: RecommendationEligibility;
  reviewStatus: ReviewStatus;
  lastAction: string;
};

type AdminIngestionContextValue = {
  adminIngestionRuns: typeof adminIngestionRuns;
  adminListings: AdminListing[];
  getAdminDashboardMetrics: () => {
    activeListings: number;
    duplicateWarnings: number;
    eligibleListings: number;
    hiddenListings: number;
    latestIngestionRun: (typeof adminIngestionRuns)[number];
    limitedListings: number;
    listingsNeedingReview: number;
    reviewRequiredListings: number;
    staleListings: number;
    totalImportedListings: number;
  };
  getAdminListingDetail: typeof getBaseAdminListingDetail;
  getReviewQueueListings: () => AdminListing[];
  lastActionByListingId: Record<string, string | undefined>;
  updateListingState: (
    listingId: string,
    nextState: {
      availabilityStatus?: ListingAvailabilityStatus;
      recommendationEligibility?: RecommendationEligibility;
      reviewStatus?: ReviewStatus;
      lastAction: string;
    },
  ) => void;
  resetListingState: (listingId: string) => void;
};

const AdminIngestionContext = createContext<AdminIngestionContextValue | null>(
  null,
);

export function AdminIngestionProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, ListingStateOverride>>(
    {},
  );

  const adminListings = useMemo(
    () =>
      baseAdminListings.map((listing) => {
        const override = overrides[listing.id];

        if (!override) {
          return listing;
        }

        return {
          ...listing,
          availabilityStatus: override.availabilityStatus,
          recommendationEligibility: override.recommendationEligibility,
          reviewStatus: override.reviewStatus,
        };
      }),
    [overrides],
  );

  const getAdminDashboardMetrics = () => {
    const totalImportedListings = adminListings.length;
    const listingsNeedingReview = adminListings.filter(
      (listing) => listing.reviewStatus === "needs_review",
    ).length;
    const activeListings = adminListings.filter(
      (listing) => listing.availabilityStatus === "active",
    ).length;
    const staleListings = adminListings.filter(
      (listing) => listing.availabilityStatus === "stale",
    ).length;
    const duplicateWarnings = adminListings.filter(
      (listing) => listing.duplicateWarning,
    ).length;
    const eligibleListings = adminListings.filter(
      (listing) => listing.recommendationEligibility === "eligible",
    ).length;
    const limitedListings = adminListings.filter(
      (listing) => listing.recommendationEligibility === "limited",
    ).length;
    const reviewRequiredListings = adminListings.filter(
      (listing) => listing.recommendationEligibility === "review_required",
    ).length;
    const hiddenListings = adminListings.filter(
      (listing) => listing.recommendationEligibility === "hidden",
    ).length;
    const latestIngestionRun = [...adminIngestionRuns].sort((left, right) =>
      right.startedAt.localeCompare(left.startedAt),
    )[0];

    return {
      activeListings,
      duplicateWarnings,
      eligibleListings,
      hiddenListings,
      limitedListings,
      latestIngestionRun,
      listingsNeedingReview,
      reviewRequiredListings,
      staleListings,
      totalImportedListings,
    };
  };

  const getReviewQueueListings = () =>
    adminListings.filter(
      (listing) =>
        listing.reviewStatus !== "approved" &&
        (listing.reviewReasons.length > 0 ||
          listing.reviewStatus === "needs_review" ||
          listing.reviewStatus === "pending"),
    );

  const getAdminListingDetail: typeof getBaseAdminListingDetail = (listingId) => {
    const detail = getBaseAdminListingDetail(listingId);

    if (!detail?.adminListing) {
      return detail;
    }

    const override = overrides[listingId];

    if (!override) {
      return detail;
    }

    return {
      ...detail,
      adminListing: {
        ...detail.adminListing,
        availabilityStatus: override.availabilityStatus,
        recommendationEligibility: override.recommendationEligibility,
        reviewStatus: override.reviewStatus,
      },
      normalizedListing: {
        ...detail.normalizedListing,
        availabilityStatus: override.availabilityStatus,
        recommendationEligibility: override.recommendationEligibility,
      },
      reviewRecord: detail.reviewRecord
        ? {
            ...detail.reviewRecord,
            reviewStatus: override.reviewStatus,
          }
        : detail.reviewRecord,
    };
  };

  const updateListingState: AdminIngestionContextValue["updateListingState"] = (
    listingId,
    nextState,
  ) => {
    const baseListing =
      adminListings.find((listing) => listing.id === listingId) ??
      baseAdminListings.find((listing) => listing.id === listingId);

    if (!baseListing) {
      return;
    }

    setOverrides((current) => ({
      ...current,
      [listingId]: {
        availabilityStatus:
          nextState.availabilityStatus ?? baseListing.availabilityStatus,
        recommendationEligibility:
          nextState.recommendationEligibility ??
          baseListing.recommendationEligibility,
        reviewStatus: nextState.reviewStatus ?? baseListing.reviewStatus,
        lastAction: nextState.lastAction,
      },
    }));
  };

  const resetListingState = (listingId: string) => {
    setOverrides((current) => {
      const next = { ...current };
      delete next[listingId];
      return next;
    });
  };

  const value: AdminIngestionContextValue = {
    adminIngestionRuns,
    adminListings,
    getAdminDashboardMetrics,
    getAdminListingDetail,
    getReviewQueueListings,
    lastActionByListingId: Object.fromEntries(
      Object.entries(overrides).map(([listingId, override]) => [
        listingId,
        override.lastAction,
      ]),
    ),
    updateListingState,
    resetListingState,
  };

  return (
    <AdminIngestionContext.Provider value={value}>
      {children}
    </AdminIngestionContext.Provider>
  );
}

export function useAdminIngestion() {
  const context = useContext(AdminIngestionContext);

  if (!context) {
    throw new Error("useAdminIngestion must be used within AdminIngestionProvider");
  }

  return context;
}

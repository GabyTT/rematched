export const listingWorkflowStatuses = [
  "imported",
  "verified",
  "seller_contacted",
  "assets_received",
  "live",
  "seller_declined",
  "no_response",
  "hidden",
  "retired",
] as const;

export type ListingWorkflowStatus = (typeof listingWorkflowStatuses)[number];

export const mainWorkflowStatuses = [
  "imported",
  "verified",
  "seller_contacted",
  "assets_received",
  "live",
] as const satisfies readonly ListingWorkflowStatus[];

export type ListingWorkflowAction =
  | "verify"
  | "contact_seller"
  | "setup_seller_access"
  | "collect_assets"
  | "publish"
  | "view_live"
  | "review_record";

export type ListingWorkflowPresentation = {
  status: ListingWorkflowStatus;
  statusLabel: string;
  nextAction: ListingWorkflowAction | null;
  nextActionLabel: string | null;
};

const workflowPresentations: Record<ListingWorkflowStatus, ListingWorkflowPresentation> = {
  imported: {
    status: "imported",
    statusLabel: "Imported",
    nextAction: "verify",
    nextActionLabel: "Verify listing",
  },
  verified: {
    status: "verified",
    statusLabel: "Verified",
    nextAction: "contact_seller",
    nextActionLabel: "Contact seller",
  },
  seller_contacted: {
    status: "seller_contacted",
    statusLabel: "Seller agreed",
    nextAction: "collect_assets",
    nextActionLabel: "Collect pics",
  },
  assets_received: {
    status: "assets_received",
    statusLabel: "Pics received",
    nextAction: "publish",
    nextActionLabel: "Publish listing",
  },
  live: {
    status: "live",
    statusLabel: "Live",
    nextAction: "view_live",
    nextActionLabel: "View live listing",
  },
  seller_declined: {
    status: "seller_declined",
    statusLabel: "Seller declined",
    nextAction: "review_record",
    nextActionLabel: "Review record",
  },
  no_response: {
    status: "no_response",
    statusLabel: "No response",
    nextAction: "contact_seller",
    nextActionLabel: "Retry contact",
  },
  hidden: {
    status: "hidden",
    statusLabel: "On hold",
    nextAction: "review_record",
    nextActionLabel: "Review record",
  },
  retired: {
    status: "retired",
    statusLabel: "Retired",
    nextAction: "review_record",
    nextActionLabel: "Review record",
  },
};

export function getListingWorkflowPresentation(input: {
  workflowStatus: ListingWorkflowStatus;
  sellerAgreementConfirmed?: boolean;
  availabilityStatus?: string;
  sellerAccess?: { accessCodeExpiresAt: string | null } | null;
}): ListingWorkflowPresentation {
  // Earlier local records could be moved to seller_contacted by an old
  // "Mark seller contacted" control. Without a recorded agreement, keep the
  // listing presented as Verified instead of implying seller consent.
  if (input.workflowStatus === "seller_contacted" && !input.sellerAgreementConfirmed) {
    return workflowPresentations.verified;
  }

  if (
    input.workflowStatus === "retired" &&
    ["sold", "unavailable"].includes(input.availabilityStatus ?? "")
  ) {
    return {
      ...workflowPresentations.retired,
      statusLabel: "Sold / unavailable",
    };
  }

  // Once a seller has agreed, the normal path is to give them access to add
  // their own photos. Collecting photos is still available as a secondary
  // WhatsApp/manual option in the admin interface; it is not the next main
  // workflow action.
  if (input.workflowStatus === "seller_contacted" && input.sellerAgreementConfirmed) {
    return {
      status: "seller_contacted",
      statusLabel: "Seller agreed",
      nextAction: "setup_seller_access",
      nextActionLabel: input.sellerAccess?.accessCodeExpiresAt
        ? "Manage seller access"
        : "Set up seller access",
    };
  }

  return workflowPresentations[input.workflowStatus];
}

export function getListingWorkflowPipelineStage(input: {
  workflowStatus: ListingWorkflowStatus;
  sellerAgreementConfirmed?: boolean;
  availabilityStatus?: string;
}) {
  const presentation = getListingWorkflowPresentation(input);

  // A no-response record is still part of seller follow-up work, not a record
  // that should disappear from the main processing rail.
  return presentation.status === "no_response" ? "seller_contacted" : presentation.status;
}

export function getListingWorkflowPipelineLabel(status: ListingWorkflowStatus) {
  return status === "seller_contacted"
    ? "Seller contacted"
    : getListingWorkflowPresentation({
        workflowStatus: status,
        sellerAgreementConfirmed: true,
      }).statusLabel;
}

export const sellerContactMethods = ["call", "whatsapp"] as const;

export type SellerContactMethod = (typeof sellerContactMethods)[number];

export const sellerContactOutcomes = [
  "agreed_assets_pending",
  "assets_received",
  "no_response",
  "seller_declined",
  "sold_or_unavailable",
] as const;

export type SellerContactOutcome = (typeof sellerContactOutcomes)[number];

export const sellerContactOutcomeLabels: Record<SellerContactOutcome, string> = {
  agreed_assets_pending: "Seller agreed — pics pending",
  assets_received: "Pics received",
  no_response: "No response",
  seller_declined: "Seller declined",
  sold_or_unavailable: "Vehicle sold or unavailable",
};

export function isSellerContactMethod(value: string): value is SellerContactMethod {
  return sellerContactMethods.includes(value as SellerContactMethod);
}

export function isSellerContactOutcome(value: string): value is SellerContactOutcome {
  return sellerContactOutcomes.includes(value as SellerContactOutcome);
}

export function isListingWorkflowStatus(value: string): value is ListingWorkflowStatus {
  return listingWorkflowStatuses.includes(value as ListingWorkflowStatus);
}

export function getNextMainWorkflowStatus(
  status: ListingWorkflowStatus,
): ListingWorkflowStatus | null {
  const currentIndex = mainWorkflowStatuses.indexOf(
    status as (typeof mainWorkflowStatuses)[number],
  );

  return currentIndex >= 0
    ? (mainWorkflowStatuses[currentIndex + 1] ?? null)
    : null;
}

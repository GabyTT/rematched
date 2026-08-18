import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";
import {
  isSellerContactMethod,
  isSellerContactOutcome,
  type ListingWorkflowStatus,
  type SellerContactOutcome,
} from "@/lib/listingWorkflow";

const outcomeWorkflowStatus: Record<SellerContactOutcome, ListingWorkflowStatus> = {
  agreed_assets_pending: "seller_contacted",
  assets_received: "assets_received",
  no_response: "no_response",
  seller_declined: "seller_declined",
  sold_or_unavailable: "retired",
};

const outcomeDatabaseUpdates: Record<
  SellerContactOutcome,
  {
    availability_status?: string;
    is_buyer_visible: boolean;
    recommendation_state: string;
    review_status: string;
  }
> = {
  agreed_assets_pending: {
    is_buyer_visible: false,
    recommendation_state: "review_required",
    review_status: "approved",
  },
  assets_received: {
    is_buyer_visible: false,
    recommendation_state: "review_required",
    review_status: "approved",
  },
  no_response: {
    is_buyer_visible: false,
    recommendation_state: "hidden",
    review_status: "hidden",
  },
  seller_declined: {
    is_buyer_visible: false,
    recommendation_state: "hidden",
    review_status: "hidden",
  },
  sold_or_unavailable: {
    availability_status: "unavailable",
    is_buyer_visible: false,
    recommendation_state: "hidden",
    review_status: "hidden",
  },
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  try {
    const body: unknown = await request.json();
    const data =
      typeof body === "object" && body !== null
        ? (body as {
            contactMethod?: unknown;
            outcome?: unknown;
            occurredAt?: unknown;
            expectedAssetsAt?: unknown;
            followUpAt?: unknown;
            followUpOverridden?: unknown;
            notes?: unknown;
          })
        : null;

    if (
      !data ||
      typeof data.contactMethod !== "string" ||
      !isSellerContactMethod(data.contactMethod) ||
      typeof data.outcome !== "string" ||
      !isSellerContactOutcome(data.outcome) ||
      typeof data.occurredAt !== "string" ||
      Number.isNaN(Date.parse(data.occurredAt)) ||
      (data.expectedAssetsAt !== undefined &&
        data.expectedAssetsAt !== null &&
        (typeof data.expectedAssetsAt !== "string" || Number.isNaN(Date.parse(data.expectedAssetsAt)))) ||
      (data.followUpAt !== undefined &&
        data.followUpAt !== null &&
        (typeof data.followUpAt !== "string" || Number.isNaN(Date.parse(data.followUpAt)))) ||
      (data.followUpOverridden !== undefined && typeof data.followUpOverridden !== "boolean") ||
      (data.notes !== undefined && data.notes !== null && typeof data.notes !== "string")
    ) {
      return NextResponse.json({ error: "Invalid seller outcome details." }, { status: 400 });
    }

    const { listingId } = await context.params;
    const supabase = createLocalAdminClient();
    const { data: listing, error: listingError } = await supabase
      .from("normalized_listings")
      .select("workflow_status")
      .eq("id", listingId)
      .single();

    if (listingError) throw listingError;

    if (!(["verified", "seller_contacted", "no_response"] as const).includes(listing.workflow_status as "verified" | "seller_contacted" | "no_response")) {
      return NextResponse.json(
        { error: "A seller outcome can only be recorded from a verified listing or a follow-up attempt." },
        { status: 409 },
      );
    }

    const workflowStatus = outcomeWorkflowStatus[data.outcome];
    const contactOccurredAt = new Date(data.occurredAt);
    const expectedAssetsAt =
      data.outcome === "agreed_assets_pending" && typeof data.expectedAssetsAt === "string"
        ? new Date(data.expectedAssetsAt)
        : null;

    if (data.outcome === "agreed_assets_pending" && !expectedAssetsAt) {
      return NextResponse.json(
        { error: "Please enter the date the seller expects to provide the pics." },
        { status: 400 },
      );
    }

    const defaultFollowUpAt =
      data.outcome === "no_response"
        ? new Date(contactOccurredAt.getTime() + 24 * 60 * 60 * 1000)
        : expectedAssetsAt
          ? new Date(expectedAssetsAt.getTime() + 24 * 60 * 60 * 1000)
          : null;
    const followUpAt =
      defaultFollowUpAt && typeof data.followUpAt === "string"
        ? new Date(data.followUpAt)
        : defaultFollowUpAt;
    const { error: updateError } = await supabase
      .from("normalized_listings")
      .update({
        workflow_status: workflowStatus,
        ...outcomeDatabaseUpdates[data.outcome],
      })
      .eq("id", listingId);

    if (updateError) throw updateError;

    const { error: eventError } = await supabase.from("listing_workflow_events").insert({
      normalized_listing_id: listingId,
      event_type: "seller_contact_outcome",
      previous_workflow_status: listing.workflow_status,
      next_workflow_status: workflowStatus,
      contact_method: data.contactMethod,
      seller_contact_outcome: data.outcome,
      notes: data.notes?.trim() || null,
      occurred_at: data.occurredAt,
      expected_assets_at: expectedAssetsAt?.toISOString() ?? null,
      follow_up_at: followUpAt?.toISOString() ?? null,
      follow_up_overridden:
        defaultFollowUpAt !== null &&
        Boolean(data.followUpOverridden) &&
        followUpAt?.getTime() !== defaultFollowUpAt.getTime(),
    });

    if (eventError) throw eventError;

    return NextResponse.json({
      workflowStatus,
      sellerAgreementConfirmed: data.outcome === "agreed_assets_pending",
      expectedAssetsAt: expectedAssetsAt?.toISOString() ?? null,
      followUpAt: followUpAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Unable to record seller outcome:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record seller outcome." },
      { status: 500 },
    );
  }
}

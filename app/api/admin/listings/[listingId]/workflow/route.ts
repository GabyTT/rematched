import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";
import {
  isListingWorkflowStatus,
  type ListingWorkflowStatus,
} from "@/lib/listingWorkflow";

const workflowDatabaseUpdates: Record<
  ListingWorkflowStatus,
  {
    availability_status?: string;
    is_buyer_visible: boolean;
    recommendation_state: string;
    review_status: string;
  }
> = {
  imported: {
    is_buyer_visible: false,
    recommendation_state: "review_required",
    review_status: "review_required",
  },
  verified: {
    is_buyer_visible: false,
    recommendation_state: "review_required",
    review_status: "approved",
  },
  seller_contacted: {
    is_buyer_visible: false,
    recommendation_state: "review_required",
    review_status: "approved",
  },
  assets_received: {
    is_buyer_visible: false,
    recommendation_state: "review_required",
    review_status: "approved",
  },
  live: {
    availability_status: "available",
    is_buyer_visible: true,
    recommendation_state: "eligible",
    review_status: "approved",
  },
  seller_declined: {
    is_buyer_visible: false,
    recommendation_state: "hidden",
    review_status: "hidden",
  },
  no_response: {
    is_buyer_visible: false,
    recommendation_state: "hidden",
    review_status: "hidden",
  },
  hidden: {
    is_buyer_visible: false,
    recommendation_state: "hidden",
    review_status: "hidden",
  },
  retired: {
    availability_status: "stale",
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
    const workflowStatus =
      typeof body === "object" && body !== null && "workflowStatus" in body
        ? (body as { workflowStatus?: unknown }).workflowStatus
        : null;

    if (typeof workflowStatus !== "string" || !isListingWorkflowStatus(workflowStatus)) {
      return NextResponse.json({ error: "Invalid workflow status." }, { status: 400 });
    }

    const { listingId } = await context.params;
    const supabase = createLocalAdminClient();

    if (workflowStatus === "live") {
      const { count, error: approvedPhotoError } = await supabase
        .from("seller_listing_media_assets")
        .select("id", { count: "exact", head: true })
        .eq("normalized_listing_id", listingId)
        .eq("approval_status", "approved");
      if (approvedPhotoError) throw approvedPhotoError;
      if (!count) {
        return NextResponse.json(
          { error: "Approve at least one seller photo before making this listing Live." },
          { status: 400 },
        );
      }
    }

    const { error } = await supabase
      .from("normalized_listings")
      .update({
        workflow_status: workflowStatus,
        ...workflowDatabaseUpdates[workflowStatus],
      })
      .eq("id", listingId);

    if (error) throw error;

    return NextResponse.json({ workflowStatus });
  } catch (error) {
    console.error("Unable to update listing workflow status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update workflow status." },
      { status: 500 },
    );
  }
}

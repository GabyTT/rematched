import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  try {
    const body: unknown = await request.json();
    const data =
      typeof body === "object" && body !== null
        ? (body as { expectedAssetsAt?: unknown; followUpAt?: unknown })
        : null;

    if (
      !data ||
      typeof data.followUpAt !== "string" ||
      Number.isNaN(Date.parse(data.followUpAt)) ||
      (data.expectedAssetsAt !== undefined &&
        data.expectedAssetsAt !== null &&
        (typeof data.expectedAssetsAt !== "string" ||
          Number.isNaN(Date.parse(data.expectedAssetsAt))))
    ) {
      return NextResponse.json({ error: "Invalid follow-up date." }, { status: 400 });
    }

    const { listingId } = await context.params;
    const supabase = createLocalAdminClient();
    const { data: listing, error: listingError } = await supabase
      .from("normalized_listings")
      .select("workflow_status")
      .eq("id", listingId)
      .single();

    if (listingError) throw listingError;

    if (listing.workflow_status !== "seller_contacted" && listing.workflow_status !== "no_response") {
      return NextResponse.json(
        { error: "A follow-up date can only be edited after the seller has been contacted." },
        { status: 409 },
      );
    }

    const { data: latestEvent, error: eventError } = await supabase
      .from("listing_workflow_events")
      .select("id, seller_contact_outcome")
      .eq("normalized_listing_id", listingId)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (eventError) throw eventError;

    if (!latestEvent) {
      return NextResponse.json(
        { error: "Record the seller outcome first before scheduling a follow-up." },
        { status: 409 },
      );
    }

    if (
      listing.workflow_status === "seller_contacted" &&
      typeof data.expectedAssetsAt !== "string"
    ) {
      return NextResponse.json(
        { error: "Please enter the date the seller expects to provide the pics." },
        { status: 400 },
      );
    }

    const expectedAssetsAt =
      typeof data.expectedAssetsAt === "string" ? new Date(data.expectedAssetsAt).toISOString() : null;
    const followUpAt = new Date(data.followUpAt).toISOString();
    const { error: updateError } = await supabase
      .from("listing_workflow_events")
      .update({
        expected_assets_at: expectedAssetsAt,
        follow_up_at: followUpAt,
        follow_up_overridden: true,
      })
      .eq("id", latestEvent.id);

    if (updateError) throw updateError;

    return NextResponse.json({ expectedAssetsAt, followUpAt });
  } catch (error) {
    console.error("Unable to update listing follow-up:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update the follow-up date." },
      { status: 500 },
    );
  }
}

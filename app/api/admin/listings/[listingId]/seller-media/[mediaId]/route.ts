import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";

function reviewStatus(value: unknown): "approved" | "rejected" | null {
  return value === "approved" || value === "rejected" ? value : null;
}

function requestedPreferredMain(value: unknown) {
  return value === true;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ listingId: string; mediaId: string }> },
) {
  try {
    const body: unknown = await request.json();
    const approvalStatus =
      typeof body === "object" && body !== null && "approvalStatus" in body
        ? reviewStatus((body as { approvalStatus?: unknown }).approvalStatus)
        : null;
    const reviewNote =
      typeof body === "object" && body !== null && "reviewNote" in body &&
      typeof (body as { reviewNote?: unknown }).reviewNote === "string"
        ? (body as { reviewNote: string }).reviewNote.trim().slice(0, 800) || null
        : null;
    const setAsPreferredMain =
      typeof body === "object" && body !== null && "setAsPreferredMain" in body
        ? requestedPreferredMain((body as { setAsPreferredMain?: unknown }).setAsPreferredMain)
        : false;

    if (!approvalStatus && !setAsPreferredMain) {
      return NextResponse.json({ error: "Choose a photo decision or set the main image." }, { status: 400 });
    }

    const { listingId, mediaId } = await context.params;
    const supabase = createLocalAdminClient();
    const { data: asset, error: assetError } = await supabase
      .from("seller_listing_media_assets")
      .select("id, approval_status")
      .eq("id", mediaId)
      .eq("normalized_listing_id", listingId)
      .maybeSingle();
    if (assetError) throw assetError;
    if (!asset) return NextResponse.json({ error: "This seller photo could not be found." }, { status: 404 });

    if (setAsPreferredMain && asset.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Approve this photo before using it as the main image." },
        { status: 409 },
      );
    }

    if (setAsPreferredMain) {
      const { error: clearPreferredMainError } = await supabase
        .from("seller_listing_media_assets")
        .update({ is_preferred_main: false })
        .eq("normalized_listing_id", listingId)
        .neq("id", mediaId);
      if (clearPreferredMainError) throw clearPreferredMainError;
    }

    const updateFields = {
      ...(approvalStatus
        ? {
            approval_status: approvalStatus,
            review_note: reviewNote,
            reviewed_at: new Date().toISOString(),
            reviewed_by: "local_admin",
          }
        : {}),
      ...(setAsPreferredMain ? { is_preferred_main: true } : {}),
      ...(approvalStatus === "rejected" && !setAsPreferredMain
        ? { is_preferred_main: false }
        : {}),
    };
    const { error: updateError } = await supabase
      .from("seller_listing_media_assets")
      .update(updateFields)
      .eq("id", mediaId)
      .eq("normalized_listing_id", listingId);
    if (updateError) throw updateError;

    return NextResponse.json({ approvalStatus, reviewNote, isPreferredMain: setAsPreferredMain || undefined });
  } catch (error) {
    console.error("Unable to review seller photo:", error);
    return NextResponse.json(
      { error: "We could not save the photo decision. Please try again." },
      { status: 500 },
    );
  }
}

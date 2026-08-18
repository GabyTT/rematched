import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";

type ReviewPayload = {
  action?: unknown;
  note?: unknown;
};

function cleanNote(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 1_000) : "";
}

const listingColumns =
  "id, display_name, title, price_amount, year, brand_name, model_name, trim_name, mileage_value, fuel_type, transmission_type, body_type, location_label, colour, engine_size, plate_series, is_negotiable, public_contact_name, public_contact_phone, workflow_status";

export async function GET(
  _request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  try {
    const { listingId } = await context.params;
    const supabase = createLocalAdminClient();
    const [{ data: listing, error: listingError }, { data: submission, error: submissionError }] =
      await Promise.all([
        supabase.from("normalized_listings").select(listingColumns).eq("id", listingId).maybeSingle(),
        supabase
          .from("seller_listing_submissions")
          .select("*")
          .eq("normalized_listing_id", listingId)
          .maybeSingle(),
      ]);

    if (listingError) throw listingError;
    if (submissionError) throw submissionError;
    if (!listing) return NextResponse.json({ error: "This listing could not be found." }, { status: 404 });
    if (!submission) {
      return NextResponse.json({ error: "This seller has not submitted an update." }, { status: 404 });
    }

    return NextResponse.json({ listing, submission });
  } catch (error) {
    console.error("Seller submission review could not be loaded", error);
    return NextResponse.json({ error: "Unable to load this seller update." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  try {
    const { listingId } = await context.params;
    const body: unknown = await request.json();
    const data = typeof body === "object" && body !== null ? (body as ReviewPayload) : null;
    const action = data?.action;
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Choose whether to approve or request changes." }, { status: 400 });
    }

    const supabase = createLocalAdminClient();
    const [{ data: listing, error: listingError }, { data: submission, error: submissionError }] =
      await Promise.all([
        supabase.from("normalized_listings").select(listingColumns).eq("id", listingId).maybeSingle(),
        supabase
          .from("seller_listing_submissions")
          .select("*")
          .eq("normalized_listing_id", listingId)
          .maybeSingle(),
      ]);
    if (listingError) throw listingError;
    if (submissionError) throw submissionError;
    if (!listing) return NextResponse.json({ error: "This listing could not be found." }, { status: 404 });
    if (!submission || submission.status !== "submitted") {
      return NextResponse.json({ error: "There is no submitted seller update to review." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const note = cleanNote(data?.note) || null;

    if (action === "approve") {
      const { error: listingUpdateError } = await supabase
        .from("normalized_listings")
        .update({
          body_type: submission.body_type,
          brand_name: submission.brand_name,
          colour: submission.colour,
          display_name: submission.display_name,
          engine_size: submission.engine_size,
          fuel_type: submission.fuel_type,
          is_negotiable: submission.is_negotiable,
          location_label: submission.location_label,
          mileage_value: submission.mileage_value,
          model_name: submission.model_name,
          plate_series: submission.plate_series,
          price_amount: submission.price_amount,
          public_contact_name: submission.public_contact_name,
          public_contact_phone: submission.public_contact_phone,
          title: submission.display_name,
          transmission_type: submission.transmission_type,
          trim_name: submission.trim_name,
          year: submission.year,
        })
        .eq("id", listingId);
      if (listingUpdateError) throw listingUpdateError;
    }

    const { error: reviewUpdateError } = await supabase
      .from("seller_listing_submissions")
      .update({
        admin_review_note: note,
        admin_review_status: action === "approve" ? "approved" : "rejected",
        admin_reviewed_at: now,
        pending_review_at: null,
      })
      .eq("id", submission.id);
    if (reviewUpdateError) throw reviewUpdateError;

    return NextResponse.json({
      ok: true,
      reviewStatus: action === "approve" ? "approved" : "rejected",
    });
  } catch (error) {
    console.error("Seller submission review could not be saved", error);
    return NextResponse.json({ error: "Unable to save the seller-update decision." }, { status: 500 });
  }
}

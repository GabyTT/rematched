import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";
import { getSellerSession } from "@/lib/sellerSession";
import { hasSellerSubmissionBuyerFacingChanges } from "@/lib/sellerSubmissionReview";

const FEATURE_OPTIONS = new Set([
  "Air Conditioning",
  "Power Windows",
  "Power Locks",
  "Power Mirrors",
  "Power Steering",
  "Anti-Locking Brakes",
  "4 Wheel Disc Brakes",
  "4 Wheel Drive",
  "Airbags",
  "Crystal Lights",
  "Projector Lights",
  "HiD Lights",
  "LED Running Lights",
  "Fog Lamps",
  "CD Player",
  "CD Changer",
  "MP3 Deck",
  "USB Deck",
  "DVD Deck / Screen",
  "Bluetooth",
  "Alloy Rims",
  "Chrome Rims",
  "Low Profile Tyres",
  "Chrome Exhaust",
  "Rear Spoiler",
  "Body Kit",
  "Side Steps",
  "Duraliner",
  "Tray Cover",
  "Sunroof",
  "Tint",
  "Alarm",
  "GPS Tracking",
  "Keyless Entry",
  "Intelligent Key",
  "Remote Start",
  "Push Button Start",
  "Steering Controls",
  "Reverse Sensors",
  "Reverse Camera",
  "Fabric Interior",
  "Leather Interior",
  "Wood Grain Finish",
  "Mirror Indicators",
]);

type SubmissionPayload = {
  action?: unknown;
  confirmedAccurate?: unknown;
  details?: Record<string, unknown>;
};

function cleanString(value: unknown, maxLength = 240) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function optionalNumber(value: unknown, maximum: number) {
  if (value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > maximum) return undefined;
  return value;
}

function safeFeatures(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && FEATURE_OPTIONS.has(item)))];
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  try {
    const session = await getSellerSession();
    if (!session) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

    const { listingId } = await context.params;
    const body: unknown = await request.json();
    const data = typeof body === "object" && body !== null ? (body as SubmissionPayload) : null;
    const details = data?.details;
    const isSubmission = data?.action === "submit";
    const isPublicationConsent = data?.action === "grant_publication_consent";

    const supabase = createLocalAdminClient();
    const { data: assignment, error: assignmentError } = await supabase
      .from("seller_listing_assignments")
      .select("id")
      .eq("seller_account_id", session.sellerAccountId)
      .eq("normalized_listing_id", listingId)
      .maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignment) return NextResponse.json({ error: "You do not have access to this car." }, { status: 403 });

    if (isPublicationConsent) {
      const [{ data: submission, error: submissionError }, { count: photoCount, error: photoError }, { data: listing, error: listingError }] =
        await Promise.all([
          supabase
            .from("seller_listing_submissions")
            .select("id, status")
            .eq("seller_account_id", session.sellerAccountId)
            .eq("normalized_listing_id", listingId)
            .maybeSingle(),
          supabase
            .from("seller_listing_media_assets")
            .select("id", { count: "exact", head: true })
            .eq("seller_account_id", session.sellerAccountId)
            .eq("normalized_listing_id", listingId),
          supabase
            .from("normalized_listings")
            .select("workflow_status")
            .eq("id", listingId)
            .maybeSingle(),
        ]);
      if (submissionError) throw submissionError;
      if (photoError) throw photoError;
      if (listingError) throw listingError;
      if (!submission || submission.status !== "submitted") {
        return NextResponse.json({ error: "Please confirm your vehicle details first." }, { status: 400 });
      }
      if (!photoCount) {
        return NextResponse.json({ error: "Please upload at least one photo first." }, { status: 400 });
      }
      if (!listing) return NextResponse.json({ error: "This car could not be found." }, { status: 404 });

      const { error: consentError } = await supabase
        .from("seller_listing_submissions")
        .update({ publication_consent_accepted_at: new Date().toISOString() })
        .eq("id", submission.id);
      if (consentError) throw consentError;

      if (listing.workflow_status !== "live" && listing.workflow_status !== "assets_received") {
        const { error: eventError } = await supabase.from("listing_workflow_events").insert({
          normalized_listing_id: listingId,
          event_type: "seller_photos_submitted",
          previous_workflow_status: listing.workflow_status,
          next_workflow_status: "assets_received",
          notes: "Seller confirmed Rev Matched may publish this vehicle and its approved photos.",
        });
        if (eventError) throw eventError;

        const { error: workflowError } = await supabase
          .from("normalized_listings")
          .update({
            workflow_status: "assets_received",
            is_buyer_visible: false,
            recommendation_state: "review_required",
            review_status: "approved",
          })
          .eq("id", listingId);
        if (workflowError) throw workflowError;
      }

      return NextResponse.json({ ok: true, status: "submitted_for_admin_approval" });
    }

    const { data: currentListing, error: currentListingError } = await supabase
      .from("normalized_listings")
      .select(
        "workflow_status, display_name, title, price_amount, is_negotiable, year, brand_name, model_name, trim_name, colour, engine_size, plate_series, mileage_value, transmission_type, fuel_type, body_type, location_label, public_contact_name, public_contact_phone",
      )
      .eq("id", listingId)
      .maybeSingle();
    if (currentListingError) throw currentListingError;
    if (!currentListing) return NextResponse.json({ error: "This car could not be found." }, { status: 404 });

    if (!details) {
      return NextResponse.json({ error: "Vehicle details are required." }, { status: 400 });
    }

    const displayName = cleanString(details.title, 160);
    const priceAmount = optionalNumber(details.priceAmount, 10_000_000);
    const year = optionalNumber(details.year, new Date().getFullYear() + 1);
    const mileageValue = optionalNumber(details.mileage, 10_000_000);
    if (!displayName || priceAmount === undefined || year === undefined || mileageValue === undefined) {
      return NextResponse.json({ error: "Please check the title, price, year, and mileage." }, { status: 400 });
    }
    if (year !== null && year < 1900) {
      return NextResponse.json({ error: "Please enter a valid vehicle year." }, { status: 400 });
    }
    if (isSubmission && data?.confirmedAccurate !== true) {
      return NextResponse.json(
        { error: "Please confirm that the details are accurate before submitting." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const values = {
      additional_info: cleanString(details.additionalInfo, 4_000) || null,
      body_type: cleanString(details.bodyType, 80) || null,
      brand_name: cleanString(details.brand, 120) || null,
      colour: cleanString(details.colour, 120) || null,
      confirmation_accepted_at: isSubmission ? now : null,
      display_name: displayName,
      engine_size: cleanString(details.engineSize, 120) || null,
      features: safeFeatures(details.features).join(", "),
      fuel_type: cleanString(details.fuelType, 80) || null,
      location_label: cleanString(details.location, 160) || null,
      mileage_value: mileageValue,
      model_name: cleanString(details.model, 120) || null,
      normalized_listing_id: listingId,
      is_negotiable: details.isNegotiable === true,
      plate_series: cleanString(details.plateSeries, 24) || null,
      price_amount: priceAmount,
      public_contact_name: cleanString(details.contactName, 160) || null,
      public_contact_phone: cleanString(details.contactPhone, 40) || null,
      seller_account_id: session.sellerAccountId,
      status: isSubmission ? "submitted" : "draft",
      submitted_at: isSubmission ? now : null,
      transmission_type: cleanString(details.transmission, 80) || null,
      trim_name: cleanString(details.trim, 120) || null,
      year,
    };

    const requiresAdminReview =
      isSubmission &&
      (currentListing.workflow_status !== "live" ||
        hasSellerSubmissionBuyerFacingChanges(currentListing, values));

    const submissionValues = {
      ...values,
      ...(isSubmission
        ? requiresAdminReview
          ? {
              admin_review_note: null,
              admin_review_status: "pending",
              admin_reviewed_at: null,
              pending_review_at: now,
            }
          : {
              // Reconfirming unchanged details on a Live card is a safe no-op.
              // Do not send Admin a review task with nothing to compare.
              admin_review_note: null,
              admin_review_status: "approved",
              admin_reviewed_at: now,
              pending_review_at: null,
            }
        : {}),
    };

    const { error: submissionError } = await supabase
      .from("seller_listing_submissions")
      .upsert(submissionValues, { onConflict: "normalized_listing_id" });
    if (submissionError) throw submissionError;

    // A material change needs fresh publication permission. An unchanged Live
    // listing keeps its existing permission and does not create review work.
    if (isSubmission && requiresAdminReview) {
      const { error: consentResetError } = await supabase
        .from("seller_listing_submissions")
        .update({ publication_consent_accepted_at: null })
        .eq("normalized_listing_id", listingId);
      if (consentResetError) throw consentResetError;
    }

    // A Live listing is the buyer-visible, Admin-approved version. Seller
    // changes stay in seller_listing_submissions until Admin reviews them.
    // Before Live, we can keep the normalised record in step with the seller
    // submission because it is still admin-only.
    if (currentListing.workflow_status !== "live") {
      const { error: listingError } = await supabase
        .from("normalized_listings")
        .update({
          body_type: values.body_type,
          brand_name: values.brand_name,
          display_name: values.display_name,
          colour: values.colour,
          engine_size: values.engine_size,
          fuel_type: values.fuel_type,
          is_negotiable: values.is_negotiable,
          location_label: values.location_label,
          mileage_value: values.mileage_value,
          model_name: values.model_name,
          price_amount: values.price_amount,
          plate_series: values.plate_series,
          title: values.display_name,
          transmission_type: values.transmission_type,
          trim_name: values.trim_name,
          public_contact_name: values.public_contact_name,
          public_contact_phone: values.public_contact_phone,
          year: values.year,
        })
        .eq("id", listingId);
      if (listingError) throw listingError;
    }

    return NextResponse.json({
      ok: true,
      status: values.status,
      pendingAdminReview: currentListing.workflow_status === "live" && requiresAdminReview,
    });
  } catch (error) {
    console.error("Seller vehicle submission failed", error);
    return NextResponse.json(
      { error: "We could not save your car details. Please try again." },
      { status: 500 },
    );
  }
}

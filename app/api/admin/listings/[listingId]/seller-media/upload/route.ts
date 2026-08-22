import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";

const SELLER_MEDIA_BUCKET = "seller-listing-media";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 10;
const extensionForContentType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160) || "seller-photo";
}

function normalizeTrinidadPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 7) return `+1868${digits}`;
  if (digits.length === 10 && digits.startsWith("868")) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1868")) return `+${digits}`;
  return null;
}

function readRawListing(value: unknown): { contact: string | null; sellerName: string | null } {
  const record = Array.isArray(value) ? value[0] : value;
  if (typeof record !== "object" || record === null) return { contact: null, sellerName: null };
  return {
    contact: typeof record.raw_contact_text === "string" ? record.raw_contact_text : null,
    sellerName: typeof record.raw_seller_label === "string" ? record.raw_seller_label : null,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const uploadedPaths: string[] = [];
  const createdMediaAssetIds: string[] = [];

  try {
    const { listingId } = await context.params;
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((candidate): candidate is File => candidate instanceof File && candidate.size > 0);
    const preferredFileIndex = Number.parseInt(String(formData.get("preferredFileIndex") ?? "0"), 10);

    if (files.length === 0) {
      return NextResponse.json({ error: "Choose at least one photo to upload." }, { status: 400 });
    }
    if (files.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json({ error: `Upload no more than ${MAX_FILES_PER_UPLOAD} photos at a time.` }, { status: 400 });
    }
    if (!Number.isInteger(preferredFileIndex) || preferredFileIndex < 0 || preferredFileIndex >= files.length) {
      return NextResponse.json({ error: "Choose the main photo." }, { status: 400 });
    }
    for (const file of files) {
      if (!(file.type in extensionForContentType)) {
        return NextResponse.json({ error: "Photos must be JPG, PNG, or WebP files." }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: "Each photo must be 10 MB or smaller." }, { status: 400 });
      }
    }

    const supabase = createLocalAdminClient();
    const { data: listing, error: listingError } = await supabase
      .from("normalized_listings")
      .select("id, workflow_status, raw_listings(raw_contact_text, raw_seller_label)")
      .eq("id", listingId)
      .maybeSingle();
    if (listingError) throw listingError;
    if (!listing) return NextResponse.json({ error: "This car could not be found." }, { status: 404 });

    const { data: assignment, error: assignmentError } = await supabase
      .from("seller_listing_assignments")
      .select("seller_account_id")
      .eq("normalized_listing_id", listingId)
      .maybeSingle();
    if (assignmentError) throw assignmentError;

    let sellerAccountId = assignment?.seller_account_id ?? null;
    if (!sellerAccountId) {
      const rawListing = readRawListing(listing.raw_listings);
      const phoneE164 = rawListing.contact ? normalizeTrinidadPhone(rawListing.contact) : null;
      if (!phoneE164) {
        return NextResponse.json({ error: "Add a valid seller contact phone number before uploading WhatsApp photos." }, { status: 400 });
      }
      const { data: sellerAccount, error: sellerAccountError } = await supabase
        .from("seller_accounts")
        .upsert({ phone_e164: phoneE164, display_name: rawListing.sellerName }, { onConflict: "phone_e164" })
        .select("id")
        .single();
      if (sellerAccountError) throw sellerAccountError;
      sellerAccountId = sellerAccount.id;
      const { error: createAssignmentError } = await supabase
        .from("seller_listing_assignments")
        .upsert({ seller_account_id: sellerAccountId, normalized_listing_id: listingId }, { onConflict: "normalized_listing_id" });
      if (createAssignmentError) throw createAssignmentError;
    }

    const { data: existingMainPhoto, error: existingMainPhotoError } = await supabase
      .from("seller_listing_media_assets")
      .select("id")
      .eq("normalized_listing_id", listingId)
      .eq("is_preferred_main", true)
      .maybeSingle();
    if (existingMainPhotoError) throw existingMainPhotoError;

    const assetRows = [];
    for (const [index, file] of files.entries()) {
      const path = `${sellerAccountId}/${listingId}/${randomUUID()}.${extensionForContentType[file.type]}`;
      const { error: storageError } = await supabase.storage
        .from(SELLER_MEDIA_BUCKET)
        .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (storageError) throw storageError;
      uploadedPaths.push(path);
      assetRows.push({
        seller_account_id: sellerAccountId,
        normalized_listing_id: listingId,
        storage_path: path,
        original_filename: safeFilename(file.name),
        content_type: file.type,
        file_size_bytes: file.size,
        is_preferred_main: !existingMainPhoto && index === preferredFileIndex,
      });
    }

    const { data: insertedAssets, error: insertError } = await supabase
      .from("seller_listing_media_assets")
      .insert(assetRows)
      .select("id");
    if (insertError) throw insertError;
    createdMediaAssetIds.push(...(insertedAssets ?? []).map((asset) => asset.id));

    if (listing.workflow_status !== "live") {
      const { error: eventError } = await supabase.from("listing_workflow_events").insert({
        normalized_listing_id: listingId,
        event_type: "seller_photos_submitted",
        previous_workflow_status: listing.workflow_status,
        next_workflow_status: "assets_received",
        notes: `Admin added ${files.length} WhatsApp photo${files.length === 1 ? "" : "s"}; awaiting photo approval.`,
      });
      if (eventError) throw eventError;
      const { error: workflowError } = await supabase
        .from("normalized_listings")
        .update({ workflow_status: "assets_received", is_buyer_visible: false, recommendation_state: "review_required", review_status: "approved" })
        .eq("id", listingId);
      if (workflowError) throw workflowError;
    }

    return NextResponse.json({ ok: true, uploadedCount: files.length });
  } catch (error) {
    if (createdMediaAssetIds.length > 0) {
      const supabase = createLocalAdminClient();
      await supabase.from("seller_listing_media_assets").delete().in("id", createdMediaAssetIds);
    }
    if (uploadedPaths.length > 0) {
      const supabase = createLocalAdminClient();
      await supabase.storage.from(SELLER_MEDIA_BUCKET).remove(uploadedPaths);
    }
    console.error("Admin seller photo upload failed", error);
    return NextResponse.json({ error: "We could not upload those photos. Please try again." }, { status: 500 });
  }
}

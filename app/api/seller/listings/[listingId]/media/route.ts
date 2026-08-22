import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";
import { getSellerSession } from "@/lib/sellerSession";

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

export async function POST(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const uploadedPaths: string[] = [];
  const createdMediaAssetIds: string[] = [];

  try {
    const session = await getSellerSession();
    if (!session) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

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
      return NextResponse.json(
        { error: `Please upload no more than ${MAX_FILES_PER_UPLOAD} photos at a time.` },
        { status: 400 },
      );
    }
    if (!Number.isInteger(preferredFileIndex) || preferredFileIndex < 0 || preferredFileIndex >= files.length) {
      return NextResponse.json({ error: "Choose a preferred main photo." }, { status: 400 });
    }

    for (const file of files) {
      if (!(file.type in extensionForContentType)) {
        return NextResponse.json(
          { error: "Photos must be JPG, PNG, or WebP files." },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Each photo must be 10 MB or smaller." },
          { status: 400 },
        );
      }
    }

    const supabase = createLocalAdminClient();
    const { data: assignment, error: assignmentError } = await supabase
      .from("seller_listing_assignments")
      .select("id")
      .eq("seller_account_id", session.sellerAccountId)
      .eq("normalized_listing_id", listingId)
      .maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignment) {
      return NextResponse.json({ error: "You do not have access to this car." }, { status: 403 });
    }

    // Once a car already has a main photo, a later seller upload stays pending
    // for Admin review instead of silently replacing the buyer-facing choice.
    const { data: existingMainPhoto, error: existingMainPhotoError } = await supabase
      .from("seller_listing_media_assets")
      .select("id")
      .eq("normalized_listing_id", listingId)
      .eq("is_preferred_main", true)
      .maybeSingle();
    if (existingMainPhotoError) throw existingMainPhotoError;

    const canChooseMainPhoto = !existingMainPhoto;

    const assetRows: Array<{
      seller_account_id: string;
      normalized_listing_id: string;
      storage_path: string;
      original_filename: string;
      content_type: string;
      file_size_bytes: number;
      is_preferred_main: boolean;
    }> = [];

    for (const [index, file] of files.entries()) {
      const extension = extensionForContentType[file.type];
      const path = `${session.sellerAccountId}/${listingId}/${randomUUID()}.${extension}`;
      const { error: storageError } = await supabase.storage
        .from(SELLER_MEDIA_BUCKET)
        .upload(path, Buffer.from(await file.arrayBuffer()), {
          contentType: file.type,
          upsert: false,
        });
      if (storageError) throw storageError;

      uploadedPaths.push(path);
      assetRows.push({
        seller_account_id: session.sellerAccountId,
        normalized_listing_id: listingId,
        storage_path: path,
        original_filename: safeFilename(file.name),
        content_type: file.type,
        file_size_bytes: file.size,
        is_preferred_main: canChooseMainPhoto && index === preferredFileIndex,
      });
    }

    const { data: insertedAssets, error: insertError } = await supabase
      .from("seller_listing_media_assets")
      .insert(assetRows)
      .select("id");
    if (insertError) throw insertError;
    createdMediaAssetIds.push(...(insertedAssets ?? []).map((asset) => asset.id));

    return NextResponse.json({
      ok: true,
      uploadedCount: files.length,
      workflowStatus: "seller_contacted",
    });
  } catch (error) {
    if (createdMediaAssetIds.length > 0) {
      try {
        const supabase = createLocalAdminClient();
        await supabase.from("seller_listing_media_assets").delete().in("id", createdMediaAssetIds);
      } catch {
        // The storage cleanup below still prevents the photos from being used.
      }
    }
    if (uploadedPaths.length > 0) {
      try {
        const supabase = createLocalAdminClient();
        await supabase.storage.from(SELLER_MEDIA_BUCKET).remove(uploadedPaths);
      } catch {
        // The original error is more helpful; an Admin can remove orphaned files if needed.
      }
    }
    console.error("Seller photo upload failed", error);
    return NextResponse.json(
      { error: "We could not upload those photos. Please try again." },
      { status: 500 },
    );
  }
}

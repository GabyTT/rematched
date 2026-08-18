import { createHash, randomInt } from "node:crypto";

import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";

const ACCESS_CODE_LENGTH = 8;
const ACCESS_CODE_LIFETIME_DAYS = 30;

function normalizeTrinidadPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 7) return `+1868${digits}`;
  if (digits.length === 10 && digits.startsWith("868")) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1868")) return `+${digits}`;

  return null;
}

function contactContainsPhone(contact: unknown, phoneE164: string) {
  const contactText = typeof contact === "string" ? contact : "";
  const possiblePhoneNumbers =
    contactText.match(/(?:\+?1?[-.\s()]*)?(?:868[-.\s()]*)?\d{3}[-.\s()]*\d{4}/g) ?? [];

  return possiblePhoneNumbers.some(
    (possiblePhoneNumber) => normalizeTrinidadPhone(possiblePhoneNumber) === phoneE164,
  );
}

function readRawContact(value: unknown): string | null {
  if (Array.isArray(value)) {
    return value.map((item) => readRawContact(item)).find((contact): contact is string => contact !== null) ?? null;
  }

  if (typeof value === "object" && value !== null && "raw_contact_text" in value) {
    const contact = value.raw_contact_text;
    return typeof contact === "string" ? contact : null;
  }

  return null;
}

function createAccessCode() {
  return Array.from({ length: ACCESS_CODE_LENGTH }, () => randomInt(0, 10)).join("");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }

  return "Unable to set up seller access.";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  try {
    const body: unknown = await request.json();
    const data =
      typeof body === "object" && body !== null
        ? (body as {
            displayName?: unknown;
            phone?: unknown;
            linkedListingIds?: unknown;
          })
        : null;

    if (
      !data ||
      typeof data.displayName !== "string" ||
      typeof data.phone !== "string" ||
      !Array.isArray(data.linkedListingIds) ||
      data.linkedListingIds.some((listingId) => typeof listingId !== "string")
    ) {
      return NextResponse.json({ error: "Enter the seller name, phone number, and cars to link." }, { status: 400 });
    }

    const { listingId } = await context.params;
    const linkedListingIds = [...new Set([...data.linkedListingIds, listingId])];
    const phoneE164 = normalizeTrinidadPhone(data.phone);
    if (!phoneE164) {
      return NextResponse.json(
        { error: "Enter a Trinidad and Tobago phone number, such as 868-555-1234." },
        { status: 400 },
      );
    }

    const displayName = data.displayName.trim() || null;
    const supabase = createLocalAdminClient();
    const { data: primaryListing, error: primaryListingError } = await supabase
      .from("normalized_listings")
      .select("id, workflow_status")
      .eq("id", listingId)
      .single();

    if (primaryListingError) throw primaryListingError;
    if (primaryListing.workflow_status !== "seller_contacted") {
      return NextResponse.json(
        { error: "Record the seller agreement before setting up seller access." },
        { status: 409 },
      );
    }

    const { data: selectedListings, error: selectedListingsError } = await supabase
      .from("normalized_listings")
      .select("id, raw_listings(raw_contact_text)")
      .in("id", linkedListingIds);

    if (selectedListingsError) throw selectedListingsError;
    if (selectedListings.length !== linkedListingIds.length) {
      return NextResponse.json({ error: "One or more selected cars could not be found." }, { status: 404 });
    }

    const hasDifferentSellerContact = selectedListings.some(
      (selectedListing) =>
        selectedListing.id !== listingId &&
        !contactContainsPhone(readRawContact(selectedListing.raw_listings), phoneE164),
    );
    if (hasDifferentSellerContact) {
      return NextResponse.json(
        { error: "You can link only cars that use this seller's same contact number." },
        { status: 400 },
      );
    }

    const { data: sellerAccount, error: sellerAccountError } = await supabase
      .from("seller_accounts")
      .upsert(
        { phone_e164: phoneE164, display_name: displayName },
        { onConflict: "phone_e164" },
      )
      .select("id, display_name, phone_e164")
      .single();

    if (sellerAccountError) throw sellerAccountError;

    const { error: assignmentError } = await supabase
      .from("seller_listing_assignments")
      .upsert(
        linkedListingIds.map((normalizedListingId) => ({
          seller_account_id: sellerAccount.id,
          normalized_listing_id: normalizedListingId,
        })),
        { onConflict: "normalized_listing_id" },
      );

    if (assignmentError) throw assignmentError;

    const accessCode = createAccessCode();
    const expiresAt = new Date(
      Date.now() + ACCESS_CODE_LIFETIME_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { error: accessCodeError } = await supabase.from("seller_access_codes").upsert(
      {
        seller_account_id: sellerAccount.id,
        code_hash: createHash("sha256").update(accessCode).digest("hex"),
        issued_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "seller_account_id" },
    );

    if (accessCodeError) throw accessCodeError;

    const { count: linkedListingCount, error: linkedListingCountError } = await supabase
      .from("seller_listing_assignments")
      .select("id", { count: "exact", head: true })
      .eq("seller_account_id", sellerAccount.id);

    if (linkedListingCountError) throw linkedListingCountError;

    return NextResponse.json({
      sellerAccess: {
        sellerAccountId: sellerAccount.id,
        displayName: sellerAccount.display_name,
        phoneE164: sellerAccount.phone_e164,
        accessCodeExpiresAt: expiresAt,
        linkedListingCount: linkedListingCount ?? linkedListingIds.length,
      },
      linkedListingIds,
      accessCode,
    });
  } catch (error) {
    console.error("Seller access setup failed", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { createLocalAdminClient } from "@/lib/adminDatabase";
import {
  createSellerSessionValue,
  SELLER_SESSION_COOKIE,
} from "@/lib/sellerSession";

function normalizeTrinidadPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 7) return `+1868${digits}`;
  if (digits.length === 10 && digits.startsWith("868")) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1868")) return `+${digits}`;

  return null;
}

function hasMatchingCode(code: string, expectedHash: string) {
  const receivedHash = createHash("sha256").update(code).digest("hex");
  const received = Buffer.from(receivedHash);
  const expected = Buffer.from(expectedHash);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const data =
      typeof body === "object" && body !== null
        ? (body as { phone?: unknown; code?: unknown })
        : null;
    const phoneE164 = typeof data?.phone === "string" ? normalizeTrinidadPhone(data.phone) : null;
    const code = typeof data?.code === "string" ? data.code.replace(/\s/g, "") : "";

    if (!phoneE164 || !/^\d{8}$/.test(code)) {
      return NextResponse.json(
        { error: "Enter the phone number and the 8-digit code exactly as provided." },
        { status: 400 },
      );
    }

    const supabase = createLocalAdminClient();
    const { data: sellerAccount, error: sellerAccountError } = await supabase
      .from("seller_accounts")
      .select("id")
      .eq("phone_e164", phoneE164)
      .maybeSingle();

    if (sellerAccountError) throw sellerAccountError;
    if (!sellerAccount) {
      return NextResponse.json({ error: "That phone number or code is not recognised." }, { status: 401 });
    }

    const { data: accessCode, error: accessCodeError } = await supabase
      .from("seller_access_codes")
      .select("code_hash, expires_at")
      .eq("seller_account_id", sellerAccount.id)
      .maybeSingle();

    if (accessCodeError) throw accessCodeError;
    if (
      !accessCode ||
      new Date(accessCode.expires_at) <= new Date() ||
      !hasMatchingCode(code, accessCode.code_hash)
    ) {
      return NextResponse.json(
        { error: "That phone number or code is not recognised, or the code has expired." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true });
    const expiresAt = new Date(accessCode.expires_at);
    response.cookies.set({
      name: SELLER_SESSION_COOKIE,
      value: createSellerSessionValue({
        sellerAccountId: sellerAccount.id,
        expiresAt: expiresAt.toISOString(),
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    console.error("Seller sign-in failed", error);
    return NextResponse.json(
      { error: "Seller sign-in is temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}

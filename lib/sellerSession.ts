import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

export const SELLER_SESSION_COOKIE = "revmatched_seller_session";

type SellerSessionPayload = {
  sellerAccountId: string;
  expiresAt: string;
};

function getSellerSessionSecret() {
  const secret = process.env.SELLER_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing seller session secret.");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSellerSessionSecret()).update(value).digest("base64url");
}

export function createSellerSessionValue(payload: SellerSessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readSellerSessionValue(value: string | undefined): SellerSessionPayload | null {
  if (!value) return null;
  const [encodedPayload, receivedSignature, ...rest] = value.split(".");
  if (!encodedPayload || !receivedSignature || rest.length > 0) return null;

  const expectedSignature = sign(encodedPayload);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("sellerAccountId" in payload) ||
      !("expiresAt" in payload) ||
      typeof payload.sellerAccountId !== "string" ||
      typeof payload.expiresAt !== "string" ||
      Number.isNaN(Date.parse(payload.expiresAt)) ||
      new Date(payload.expiresAt) <= new Date()
    ) {
      return null;
    }

    return {
      sellerAccountId: payload.sellerAccountId,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function getSellerSession() {
  const cookieStore = await cookies();
  return readSellerSessionValue(cookieStore.get(SELLER_SESSION_COOKIE)?.value);
}

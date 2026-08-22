import { NextResponse } from "next/server";

import { SELLER_SESSION_COOKIE } from "@/lib/sellerSession";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SELLER_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

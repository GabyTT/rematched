import { NextResponse } from "next/server";

import { SELLER_SESSION_COOKIE } from "@/lib/sellerSession";

// This is the entry point included in every seller invitation. It deliberately
// clears a browser's previous seller session first, so an invitation for one
// seller cannot silently open another seller's cars on a shared test device.
export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/seller", request.url));
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

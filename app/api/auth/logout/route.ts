import { NextResponse } from "next/server";
import { cookieNames, getAuthConfig, getCookieOptions } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST() {
  const { appUrl } = getAuthConfig();
  const response = NextResponse.redirect(new URL("/login", appUrl), 303);
  response.cookies.set(cookieNames.access, "", getCookieOptions(0));
  response.cookies.set(cookieNames.refresh, "", getCookieOptions(0));
  response.cookies.set(cookieNames.expiresAt, "", getCookieOptions(0));
  response.cookies.set(cookieNames.idToken, "", getCookieOptions(0));
  response.cookies.set(cookieNames.state, "", getCookieOptions(0));
  response.cookies.set(cookieNames.verifier, "", getCookieOptions(0));
  return response;
}

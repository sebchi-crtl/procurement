import { NextResponse } from "next/server";
import {
  cookieNames,
  getAuthConfig,
  getCookieOptions,
  getExpiresAt,
  toBasicAuth,
} from "@/lib/auth-server";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { issuer, clientId, clientSecret, redirectUri, appUrl } = getAuthConfig();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => {
        const idx = v.indexOf("=");
        return [decodeURIComponent(v.slice(0, idx)), decodeURIComponent(v.slice(idx + 1))];
      }),
  );

  const savedState = cookies[cookieNames.state];
  if (!code || !state || !savedState || state !== savedState) {
    const invalid = NextResponse.redirect(new URL("/login?error=Invalid+state", appUrl));
    invalid.cookies.set(cookieNames.state, "", getCookieOptions(0));
    invalid.cookies.set(cookieNames.verifier, "", getCookieOptions(0));
    return invalid;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch(`${issuer}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${toBasicAuth(clientId, clientSecret)}`,
    },
    body: body.toString(),
    cache: "no-store",
  });

  const tokenData = (await tokenRes.json().catch(() => ({}))) as TokenResponse;
  if (!tokenRes.ok || !tokenData.access_token) {
    const message =
      tokenData.error_description || tokenData.error || "Token exchange failed";
    const failed = NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, appUrl),
    );
    failed.cookies.set(cookieNames.state, "", getCookieOptions(0));
    failed.cookies.set(cookieNames.verifier, "", getCookieOptions(0));
    failed.cookies.set(cookieNames.access, "", getCookieOptions(0));
    failed.cookies.set(cookieNames.refresh, "", getCookieOptions(0));
    failed.cookies.set(cookieNames.expiresAt, "", getCookieOptions(0));
    failed.cookies.set(cookieNames.idToken, "", getCookieOptions(0));
    return failed;
  }

  const response = NextResponse.redirect(new URL("/dashboard", appUrl));
  response.cookies.set(cookieNames.access, tokenData.access_token, getCookieOptions());
  if (tokenData.refresh_token) {
    response.cookies.set(cookieNames.refresh, tokenData.refresh_token, getCookieOptions());
  }
  if (tokenData.id_token) {
    response.cookies.set(cookieNames.idToken, tokenData.id_token, getCookieOptions());
  }
  response.cookies.set(cookieNames.expiresAt, getExpiresAt(tokenData.expires_in), getCookieOptions());
  response.cookies.set(cookieNames.state, "", getCookieOptions(0));
  response.cookies.set(cookieNames.verifier, "", getCookieOptions(0));
  return response;
}

import { cookies } from "next/headers";
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
};

export const runtime = "nodejs";

export async function POST() {
  const { issuer, clientId, clientSecret } = getAuthConfig();
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(cookieNames.refresh)?.value;

  if (!refreshToken) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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

  if (!tokenRes.ok) {
    const failed = NextResponse.json({ ok: false }, { status: 401 });
    failed.cookies.set(cookieNames.access, "", getCookieOptions(0));
    failed.cookies.set(cookieNames.refresh, "", getCookieOptions(0));
    failed.cookies.set(cookieNames.expiresAt, "", getCookieOptions(0));
    failed.cookies.set(cookieNames.idToken, "", getCookieOptions(0));
    return failed;
  }

  const tokenData = (await tokenRes.json().catch(() => ({}))) as TokenResponse;
  if (!tokenData.access_token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieNames.access, tokenData.access_token, getCookieOptions());
  response.cookies.set(
    cookieNames.refresh,
    tokenData.refresh_token || refreshToken,
    getCookieOptions(),
  );
  if (tokenData.id_token) {
    response.cookies.set(cookieNames.idToken, tokenData.id_token, getCookieOptions());
  }
  response.cookies.set(cookieNames.expiresAt, getExpiresAt(tokenData.expires_in), getCookieOptions());
  return response;
}

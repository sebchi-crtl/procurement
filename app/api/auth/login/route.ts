import { NextResponse } from "next/server";
import {
  cookieNames,
  createPkceChallenge,
  createPkceVerifier,
  createState,
  getAuthConfig,
  getCookieOptions,
} from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET() {
  const { issuer, clientId, redirectUri } = getAuthConfig();
  const state = createState();
  const codeVerifier = createPkceVerifier();
  const codeChallenge = createPkceChallenge(codeVerifier);

  const authorizeUrl = new URL(`${issuer}/oauth2/authorize`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "openid profile email offline_access");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(cookieNames.state, state, getCookieOptions(600));
  response.cookies.set(cookieNames.verifier, codeVerifier, getCookieOptions(600));
  return response;
}

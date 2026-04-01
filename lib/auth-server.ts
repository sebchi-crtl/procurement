import { createHash, randomBytes } from "crypto";

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge?: number;
};

const ACCESS_COOKIE = "auth_access_token";
const REFRESH_COOKIE = "auth_refresh_token";
const EXPIRES_AT_COOKIE = "auth_expires_at";
const ID_TOKEN_COOKIE = "auth_id_token";
const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_VERIFIER_COOKIE = "oauth_code_verifier";

export const cookieNames = {
  access: ACCESS_COOKIE,
  refresh: REFRESH_COOKIE,
  expiresAt: EXPIRES_AT_COOKIE,
  idToken: ID_TOKEN_COOKIE,
  state: OAUTH_STATE_COOKIE,
  verifier: OAUTH_VERIFIER_COOKIE,
};

export function getAuthConfig() {
  const issuer = process.env.AUTH_ISSUER?.replace(/\/$/, "");
  const clientId = process.env.AUTH_CLIENT_ID;
  const clientSecret = process.env.AUTH_CLIENT_SECRET;
  const redirectUri = process.env.AUTH_REDIRECT_URI;
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");

  if (!issuer || !clientId || !clientSecret || !redirectUri || !appUrl) {
    throw new Error("Missing AUTH_ISSUER, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_REDIRECT_URI, or APP_URL");
  }

  return { issuer, clientId, clientSecret, redirectUri, appUrl };
}

export function toBasicAuth(clientId: string, clientSecret: string) {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export function createState() {
  return randomBytes(24).toString("hex");
}

export function createPkceVerifier() {
  return randomBytes(64).toString("base64url");
}

export function createPkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function getCookieOptions(maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function getExpiresAt(expiresIn?: number) {
  const seconds = Number.isFinite(expiresIn) && (expiresIn as number) > 0 ? (expiresIn as number) : 900;
  return String(Math.floor(Date.now() / 1000) + seconds);
}

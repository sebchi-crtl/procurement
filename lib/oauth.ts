/** OAuth2 authorization code (no PKCE) — for testing / confidential client flows. */

export function getOAuthConfig() {
  const baseUrl =
    process.env.NEXT_PUBLIC_OAUTH_BASE_URL?.replace(/\/$/, "") ||
    "http://134.209.20.12";
  const clientId =
    process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || "procurement-client";
  /** Only for browser-direct token exchange (dev). Never commit real secrets. */
  const clientSecret =
    process.env.NEXT_PUBLIC_OAUTH_CLIENT_SECRET?.trim() || "";
  const redirectUri =
    process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ||
    "http://localhost:3000/callback";
  const scope =
    process.env.NEXT_PUBLIC_OAUTH_SCOPE || "openid profile email offline_access";
  const tokenUrl =
    process.env.NEXT_PUBLIC_OAUTH_TOKEN_URL?.trim() ||
    `${baseUrl}/oauth2/token`;
  /** If true, callback calls the IdP token URL from the browser (visible in Network tab). */
  const browserTokenExchange =
    process.env.NEXT_PUBLIC_OAUTH_BROWSER_TOKEN?.trim() === "true";
  return {
    baseUrl,
    clientId,
    clientSecret,
    redirectUri,
    scope,
    tokenUrl,
    browserTokenExchange,
  };
}

/** RFC 6749 client_secret_basic — use from client components only (btoa). */
export function oauth2BasicAuthorizationHeader(
  clientId: string,
  clientSecret: string,
): string {
  console.log("oauth2BasicAuthorizationHeader clientId ", clientId);
  console.log("oauth2BasicAuthorizationHeader clientSecret ", clientSecret);
  console.log("oauth2BasicAuthorizationHeader btoa ", btoa(`${clientId}:${clientSecret}`));
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

/** Starts authorization code flow (no PKCE). */
export async function startLogin(): Promise<void> {
  if (typeof window === "undefined") return;

  const { baseUrl, clientId, redirectUri, scope } = getOAuthConfig();
  const state = crypto.randomUUID();

  sessionStorage.setItem("oauth_state", state);

  const url = new URL(`${baseUrl}/oauth2/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);

  window.location.href = url.toString();
}

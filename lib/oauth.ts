/** OAuth / PKCE settings for the sample procurement app (public client, no secret). */

export function getOAuthConfig() {
  const baseUrl =
    process.env.NEXT_PUBLIC_OAUTH_BASE_URL?.replace(/\/$/, "") ||
    "http://134.209.20.12";
  const clientId =
    process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || "procurement-client";
  const redirectUri =
    process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ||
    "http://localhost:3000/callback";
  const scope =
    process.env.NEXT_PUBLIC_OAUTH_SCOPE || "openid profile email";
  return { baseUrl, clientId, redirectUri, scope };
}

const PKCE_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

function randomCodeVerifier(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(64));
  return Array.from(bytes, (b) => PKCE_CHARSET[b % 66]).join("");
}

async function codeChallengeS256(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Starts the authorization code + PKCE flow (no client secret, no Bearer on token). */
export async function startLogin(): Promise<void> {
  if (typeof window === "undefined") return;

  const { baseUrl, clientId, redirectUri, scope } = getOAuthConfig();
  const state = crypto.randomUUID();
  const codeVerifier = randomCodeVerifier();
  const codeChallenge = await codeChallengeS256(codeVerifier);

  sessionStorage.setItem("oauth_state", state);
  sessionStorage.setItem("pkce_code_verifier", codeVerifier);

  const url = new URL(`${baseUrl}/oauth2/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  window.location.href = url.toString();
}

"use client";

import { getOAuthConfig } from "@/lib/oauth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const oauthError = searchParams.get("error");
        const oauthDesc = searchParams.get("error_description");
        if (oauthError) {
          throw new Error(
            oauthDesc || oauthError || "Authorization server returned an error",
          );
        }

        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const savedState = sessionStorage.getItem("oauth_state");
        const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

        if (!code) throw new Error("Missing authorization code");
        if (!state || !savedState || state !== savedState) {
          throw new Error("Invalid state");
        }
        if (!codeVerifier) throw new Error("Missing PKCE code_verifier");

        const { clientId, redirectUri } = getOAuthConfig();

        const tokenRes = await fetch("/api/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: codeVerifier,
          }),
        });

        const tokenData: Record<string, unknown> = await tokenRes.json();

        if (!tokenRes.ok) {
          const msg =
            (typeof tokenData.error_description === "string" &&
              tokenData.error_description) ||
            (typeof tokenData.error === "string" && tokenData.error) ||
            "Token exchange failed";
          throw new Error(msg);
        }

        if (typeof tokenData.access_token === "string") {
          localStorage.setItem("access_token", tokenData.access_token);
        }
        if (
          typeof tokenData.refresh_token === "string" &&
          tokenData.refresh_token
        ) {
          localStorage.setItem("refresh_token", tokenData.refresh_token);
        }
        if (typeof tokenData.id_token === "string" && tokenData.id_token) {
          localStorage.setItem("id_token", tokenData.id_token);
        }

        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("pkce_code_verifier");

        router.replace("/dashboard");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "oauth_callback_failed";
        console.error("OAuth callback error:", err);
        router.replace(`/login?error=${encodeURIComponent(message)}`);
      }
    };

    void handleCallback();
  }, [searchParams, router]);

  return <p className="text-center text-zinc-600">Signing you in...</p>;
}

export default function CallbackPage() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4">
      <Suspense fallback={<p className="text-zinc-600">Signing you in...</p>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}

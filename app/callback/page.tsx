"use client";

import { getOAuthConfig, oauth2BasicAuthorizationHeader } from "@/lib/oauth";
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

        if (!code) throw new Error("Missing authorization code");
        if (!state || !savedState || state !== savedState) {
          throw new Error("Invalid state");
        }

        const {
          clientId,
          clientSecret,
          redirectUri,
          tokenUrl,
          browserTokenExchange,
        } = getOAuthConfig();

        let tokenRes: Response;
        if (browserTokenExchange) {
          if (!clientSecret) {
            throw new Error(
              "NEXT_PUBLIC_OAUTH_CLIENT_SECRET is required for Authorization: Basic",
            );
          }
          const body = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
          });
          tokenRes = await fetch(tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
              Authorization: oauth2BasicAuthorizationHeader(
                clientId,
                clientSecret,
              ),
            },
            body: body.toString(),
          });
        } else {
          tokenRes = await fetch("/api/oauth/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              grant_type: "authorization_code",
              code,
              redirect_uri: redirectUri,
            }),
          });
        }

        const raw = await tokenRes.text();
        let tokenData: Record<string, unknown> = {};
        if (raw.trim()) {
          try {
            tokenData = JSON.parse(raw) as Record<string, unknown>;
          } catch {
            throw new Error("Token response was not valid JSON");
          }
        } else if (!tokenRes.ok) {
          throw new Error(`Token exchange failed (${tokenRes.status})`);
        }

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

        router.replace("/dashboard");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "oauth_callback_failed";
        console.error("OAuth callback error:", err);
        console.error("OAuth callback error message:", message);
        console.error("OAuth callback error stack:", encodeURIComponent(message));
        // router.replace(`/login?error=${encodeURIComponent(message)}`);
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

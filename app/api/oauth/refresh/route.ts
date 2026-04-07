export const runtime = "nodejs";

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")}`;
}

function shouldSendClientSecret(): boolean {
  return process.env.OAUTH_USE_CLIENT_SECRET?.trim().toLowerCase() === "true";
}

function getClientSecret(): string {
  if (!shouldSendClientSecret()) return "";
  return (
    process.env.OAUTH_CLIENT_SECRET?.trim() ||
    process.env.AUTH_CLIENT_SECRET?.trim() ||
    process.env.NEXT_PUBLIC_OAUTH_CLIENT_SECRET?.trim() ||
    ""
  );
}

function getTokenUrl(baseUrl: string) {
  const override = process.env.OAUTH_TOKEN_ENDPOINT?.trim();
  if (override) return override;
  return `${baseUrl.replace(/\/$/, "")}/oauth2/token`;
}

type Body = {
  refresh_token?: string;
};

/**
 * POST /oauth2/token
 * Content-Type: application/x-www-form-urlencoded
 * Authorization: Basic base64(client_id:client_secret)
 * Body: grant_type=refresh_token&refresh_token=...
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Body;
    const refreshToken = payload.refresh_token?.trim();
    if (!refreshToken) {
      return Response.json(
        { error: "invalid_request", error_description: "refresh_token required" },
        { status: 400 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_OAUTH_BASE_URL?.replace(/\/$/, "") ||
      "http://134.209.20.12";
    const clientId =
      process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || "procurement-client";
    const clientSecret = getClientSecret();

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };

    if (clientSecret) {
      headers.Authorization = basicAuthHeader(clientId, clientSecret);
    }

    const tokenUrl = getTokenUrl(baseUrl);
    const upstreamRes = await fetch(tokenUrl, {
      method: "POST",
      headers,
      body: params.toString(),
      cache: "no-store",
      redirect: "manual",
    });

    if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
      const loc = upstreamRes.headers.get("location") || "";
      return Response.json(
        {
          error: "upstream_redirect",
          error_description: `Token endpoint returned ${upstreamRes.status} redirect to ${loc || "(no Location)"}.`,
        },
        { status: 502 },
      );
    }

    const raw = await upstreamRes.text();
    const contentType = upstreamRes.headers.get("content-type") || "";

    if (contentType.includes("application/json") && raw.trim()) {
      try {
        const json = JSON.parse(raw) as Record<string, unknown>;
        return Response.json(json, { status: upstreamRes.status });
      } catch {
        return Response.json(
          {
            error: "invalid_json",
            error_description: "Token endpoint returned invalid JSON",
            raw: raw.slice(0, 500),
          },
          { status: 502 },
        );
      }
    }

    return Response.json(
      {
        error: "unexpected_response",
        error_description: "Token endpoint did not return JSON.",
        status: upstreamRes.status,
        body_preview: raw.slice(0, 200),
      },
      { status: upstreamRes.ok ? 502 : upstreamRes.status },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Refresh token exchange failed";
    console.error("OAuth refresh error:", error);
    return Response.json(
      { error: "oauth_refresh_error", error_description: message },
      { status: 500 },
    );
  }
}

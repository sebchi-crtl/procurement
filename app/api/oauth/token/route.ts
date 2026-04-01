type TokenPayload = {
  grant_type?: string;
  code?: string;
  redirect_uri?: string;
  client_id?: string;
  code_verifier?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TokenPayload;
    const baseUrl =
      process.env.NEXT_PUBLIC_OAUTH_BASE_URL?.replace(/\/$/, "") ||
      "http://134.209.20.12";

    const body = new URLSearchParams({
      grant_type: payload.grant_type || "authorization_code",
      code: payload.code || "",
      redirect_uri: payload.redirect_uri || "",
      client_id: payload.client_id || "",
      code_verifier: payload.code_verifier || "",
    });

    const upstreamRes = await fetch(`${baseUrl}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    });

    const contentType = upstreamRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await upstreamRes.json();
      return Response.json(json, { status: upstreamRes.status });
    }

    const text = await upstreamRes.text();
    return new Response(text, {
      status: upstreamRes.status,
      headers: { "Content-Type": contentType || "text/plain; charset=utf-8" },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Token exchange failed";
    console.error("OAuth proxy token exchange error:", error);
    return Response.json(
      { error: "oauth_proxy_error", error_description: message },
      { status: 500 },
    );
  }
}

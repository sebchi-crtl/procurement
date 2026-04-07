/** Refresh access token using stored refresh_token (server proxy: POST /api/oauth/refresh). */

export async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  const res = await fetch("/api/oauth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const raw = await res.text();
  let data: Record<string, unknown> = {};
  if (raw.trim()) {
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return false;
    }
  }

  if (!res.ok) return false;
  if (typeof data.access_token !== "string") return false;

  localStorage.setItem("access_token", data.access_token);
  if (typeof data.refresh_token === "string" && data.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token);
  }
  if (typeof data.id_token === "string" && data.id_token) {
    localStorage.setItem("id_token", data.id_token);
  }
  if (typeof data.expires_in === "number" && data.expires_in > 0) {
    localStorage.setItem(
      "token_expires_at",
      String(Date.now() + data.expires_in * 1000),
    );
  }
  localStorage.setItem("token_refreshed_at", String(Date.now()));

  return true;
}

export function isAccessTokenLikelyExpired(): boolean {
  const raw = localStorage.getItem("token_expires_at");
  if (!raw) return false;
  const ms = Number(raw);
  if (!Number.isFinite(ms)) return false;
  return Date.now() >= ms - 30_000;
}

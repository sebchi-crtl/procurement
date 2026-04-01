"use client";

import { useEffect } from "react";
import { fetchWithAutoRefresh } from "@/lib/fetch-with-auto-refresh";

async function maybeRefreshToken() {
  const sessionRes = await fetch("/api/auth/session", { credentials: "include" });
  if (!sessionRes.ok) return;

  const session = (await sessionRes.json()) as {
    authenticated?: boolean;
    expiresAt?: number;
  };

  if (!session.authenticated || !session.expiresAt) return;

  const now = Math.floor(Date.now() / 1000);
  if (session.expiresAt - now < 60) {
    await fetchWithAutoRefresh("/api/auth/session");
  }
}

export function AuthRefreshDaemon() {
  useEffect(() => {
    void maybeRefreshToken();
    const id = window.setInterval(() => {
      void maybeRefreshToken();
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return null;
}

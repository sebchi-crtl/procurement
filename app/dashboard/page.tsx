"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isAccessTokenLikelyExpired,
  refreshAccessToken,
} from "@/lib/refresh-token";

/** JWTs often share the same leading characters; show length + ends so refreshes look different. */
function tokenPreview(value: string | null, keep = 6): string {
  if (!value) return "—";
  if (value.length <= keep * 2) return `${value} (${value.length} chars)`;
  return `${value.slice(0, keep)}…${value.slice(-keep)} (${value.length} chars)`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [access, setAccess] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [idTok, setIdTok] = useState<string | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      let accessTok = localStorage.getItem("access_token");
      const refreshTok = localStorage.getItem("refresh_token");

      if (!accessTok && refreshTok) {
        setRefreshStatus("Refreshing session…");
        const ok = await refreshAccessToken();
        setRefreshStatus(ok ? null : "Refresh failed — sign in again.");
        accessTok = localStorage.getItem("access_token");
      } else if (accessTok && refreshTok && isAccessTokenLikelyExpired()) {
        setRefreshStatus("Refreshing session…");
        const ok = await refreshAccessToken();
        setRefreshStatus(ok ? null : "Refresh failed — sign in again.");
        accessTok = localStorage.getItem("access_token");
      }

      setMounted(true);
      setAccess(accessTok);
      setRefresh(localStorage.getItem("refresh_token"));
      setIdTok(localStorage.getItem("id_token"));
      const tr = localStorage.getItem("token_refreshed_at");
      setLastRefreshedAt(
        tr ? new Date(Number(tr)).toLocaleString() : null,
      );
    }

    void load();
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("id_token");
    localStorage.removeItem("token_expires_at");
    localStorage.removeItem("token_refreshed_at");
    router.replace("/login");
  }

  async function manualRefresh() {
    setRefreshStatus("Refreshing…");
    const ok = await refreshAccessToken();
    if (ok) {
      setRefreshStatus("Session refreshed.");
      const tr = localStorage.getItem("token_refreshed_at");
      setLastRefreshedAt(
        tr ? new Date(Number(tr)).toLocaleString() : new Date().toLocaleString(),
      );
    } else {
      setRefreshStatus("Refresh failed — check Network → /api/oauth/refresh and IdP response.");
    }
    setAccess(localStorage.getItem("access_token"));
    setRefresh(localStorage.getItem("refresh_token"));
    setIdTok(localStorage.getItem("id_token"));
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-zinc-600">
        Loading…
      </div>
    );
  }

  if (!access) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-zinc-600">
          {refreshStatus || "No session. Sign in first."}
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Tokens in <code className="text-xs">localStorage</code>. Refresh uses{" "}
        <code className="text-xs">POST /api/oauth/refresh</code> (Basic auth to
        IdP). Access tokens are often JWTs with the same prefix — length + ends
        below show when values change.
      </p>
      {lastRefreshedAt ? (
        <p className="mt-1 text-xs text-zinc-500">
          Last successful refresh: {lastRefreshedAt}
        </p>
      ) : null}
      {refreshStatus ? (
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {refreshStatus}
        </p>
      ) : null}

      <dl className="mt-8 space-y-4 font-mono text-sm">
        <div>
          <dt className="text-zinc-500">access_token</dt>
          <dd className="mt-1 break-all text-zinc-900 dark:text-zinc-100">
            {tokenPreview(access)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">refresh_token</dt>
          <dd className="mt-1 break-all text-zinc-900 dark:text-zinc-100">
            {tokenPreview(refresh)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">id_token</dt>
          <dd className="mt-1 break-all text-zinc-900 dark:text-zinc-100">
            {tokenPreview(idTok)}
          </dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => void manualRefresh()}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Refresh access token
        </button>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Sign out
        </button>
        <Link
          href="/"
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 underline underline-offset-2"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function mask(value: string | null, keep = 8): string {
  if (!value) return "—";
  if (value.length <= keep * 2) return "•".repeat(Math.min(value.length, 12));
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [access, setAccess] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [idTok, setIdTok] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setAccess(localStorage.getItem("access_token"));
    setRefresh(localStorage.getItem("refresh_token"));
    setIdTok(localStorage.getItem("id_token"));
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("id_token");
    router.replace("/login");
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
        <p className="text-zinc-600">No session. Sign in first.</p>
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
        Tokens stored in <code className="text-xs">localStorage</code> for
        testing only.
      </p>

      <dl className="mt-8 space-y-4 font-mono text-sm">
        <div>
          <dt className="text-zinc-500">access_token</dt>
          <dd className="mt-1 break-all text-zinc-900 dark:text-zinc-100">
            {mask(access)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">refresh_token</dt>
          <dd className="mt-1 break-all text-zinc-900 dark:text-zinc-100">
            {mask(refresh)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">id_token</dt>
          <dd className="mt-1 break-all text-zinc-900 dark:text-zinc-100">
            {mask(idTok)}
          </dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-wrap gap-4">
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

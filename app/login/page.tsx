"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { startLogin } from "@/lib/oauth";

function LoginError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  if (!error) return null;
  return (
    <p
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
      role="alert"
    >
      {error}
    </p>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Procurement sample
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            OAuth2 authorization code (browser token exchange optional)
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginError />
        </Suspense>

        <button
          type="button"
          onClick={() => void startLogin()}
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Sign in with OAuth
        </button>

        <p className="text-center text-xs text-zinc-500">
          <Link href="/" className="underline underline-offset-2 hover:text-zinc-700">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

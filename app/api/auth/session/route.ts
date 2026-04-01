import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieNames } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const expiresAt = Number(cookieStore.get(cookieNames.expiresAt)?.value || "0");
  const hasAccess = Boolean(cookieStore.get(cookieNames.access)?.value);

  return NextResponse.json({
    authenticated: hasAccess,
    expiresAt,
  });
}

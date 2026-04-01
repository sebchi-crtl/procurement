import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookieNames } from "@/lib/auth-server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(cookieNames.access)?.value;

  if (!accessToken && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Please sign in");
    return NextResponse.redirect(loginUrl);
  }

  if (accessToken && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};

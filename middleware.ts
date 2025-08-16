import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Helper to get the correct secret and cookie name for Vercel/live
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const useSecureCookies = NEXTAUTH_URL.startsWith("https://");
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const sessionTokenName = `${cookiePrefix}next-auth.session-token`;

export async function middleware(request: NextRequest) {
  // Try to get token from cookies (for edge compatibility)
  let token = await getToken({
    req: request,
    secret: NEXTAUTH_SECRET,
    cookieName: sessionTokenName,
  });

  // Fallback: try default cookie name (for local/dev)
  if (!token) {
    token = await getToken({
      req: request,
      secret: NEXTAUTH_SECRET,
    });
  }

  const isAuthenticated = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect dashboard routes
  if (isDashboardPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

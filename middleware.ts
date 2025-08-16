import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if user is accessing dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Check for session cookie
    const session = request.cookies.get("session")

    if (!session) {
      // Redirect to login if no session
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/dashboard/:path*",
}

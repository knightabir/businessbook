import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })
  
  const isAuthenticated = !!token
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard")

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Protect dashboard routes
  if (isDashboardPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*"
  ]
}

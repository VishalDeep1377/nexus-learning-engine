import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow auth-related routes
        if (
          pathname.startsWith("/api/auth") ||
          pathname === "/auth/login" ||
          pathname === "/auth/signup" ||
          pathname === "/api/news/latest"
        ) {
          return true;
        }

        // Public routes
        if (pathname === "/" || pathname.startsWith("/api/videos")) {
          return true;
        }
        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|site.webmanifest|manifest.json|sw.js|icons/|public/).*)",
  ],
};
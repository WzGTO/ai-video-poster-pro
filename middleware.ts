import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Routes that require authentication
const protectedRoutes = ["/dashboard"];

// Routes that are always public
const publicRoutes = ["/", "/login", "/api/auth"];

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (isProtectedRoute) {
        const session = await auth();

        if (!session) {
            // Redirect to login page with callback URL
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Check if there's a token refresh error
        if (session.error === "RefreshAccessTokenError") {
            // Force re-login if refresh token failed
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("error", "session_expired");
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)",
    ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Exclude API routes, Static files, Next internals, and Login page
    const isPublicPath =
        path.startsWith("/api") ||
        path.startsWith("/_next") ||
        path.startsWith("/static") ||
        path === "/login" ||
        path === "/favicon.ico";

    if (isPublicPath) {
        return NextResponse.next();
    }

    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

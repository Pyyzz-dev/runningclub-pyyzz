import { NextResponse, type NextRequest } from "next/server";
import {
  redirectWithSessionCookies,
  updateSession,
} from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/history",
  "/achievements",
  "/training",
  "/events",
  "/leaderboard",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const PUBLIC_PREFIXES = ["/community"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function withPathname(response: NextResponse, pathname: string) {
  response.headers.set("x-pathname", pathname);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next/static")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return response;
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);
  withPathname(supabaseResponse, pathname);

  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile")) {
    if (!user) {
      return redirectWithSessionCookies(request, supabaseResponse, "/login", {
        redirect: pathname,
        redirectedFrom: pathname,
      });
    }
    return supabaseResponse;
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return redirectWithSessionCookies(request, supabaseResponse, "/login", {
        redirect: pathname,
        redirectedFrom: pathname,
      });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return redirectWithSessionCookies(request, supabaseResponse, "/");
    }

    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/_next/static/:path*",
    "/((?!_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname of request (e.g. school.edutrac.com, school.localhost:3000)
  let hostname = req.headers
    .get("host")!
    .replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

  // special case for Vercel preview deployment URLs
  if (
    hostname.includes("---") &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split("---")[0]}.${
      process.env.NEXT_PUBLIC_ROOT_DOMAIN
    }`;
  }

  const searchParams = req.nextUrl.searchParams.toString();
  // Get the pathname of the request (e.g. /, /about, /students/first-student)
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;

  // Log for debugging
  console.log("Middleware processing - Hostname:", hostname, "Path:", path);

  // rewrites for app dashboard pages - handles both app.edutrac.com and app.localhost:3000
  if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` || hostname === "app.localhost:3000") {
    const session = await getToken({ req });
    if (!session && !path.startsWith('/login') && !path.startsWith('/register')) {
      return NextResponse.redirect(new URL("/login", req.url));
    } else if (session && (path === '/login' || path === '/register')) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // Modify the rewrite path to use the correct app route
    const newPath = path === '/dashboard' ? '/app/dashboard' : `/app${path}`;
    console.log("App dashboard route - rewriting to:", newPath);
    return NextResponse.rewrite(new URL(newPath, req.url));
  }

  // Special case for root domain - this fixes your home page issue
  if (
    hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    hostname === "localhost:3000" ||
    hostname === "edutrac.com"
  ) {
    console.log("Root domain - rewriting to:", `/home${path === "/" ? "" : path}`);
    return NextResponse.rewrite(new URL(`/home${path === "/" ? "" : path}`, req.url));
  }

  // For subdomains like school.edutrac.com or school.localhost:3000 - rewrite to domain route
  const subdomain = hostname.split('.')[0];
  console.log("School domain - rewriting to:", `/${subdomain}${path}`);
  return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
}
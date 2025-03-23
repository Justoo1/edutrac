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

  // rewrites for app dashboard pages
  if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
    const session = await getToken({ req });
    if (!session && !path.startsWith('/auth/login')) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    } else if (session && path.startsWith('/auth/login')) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.rewrite(new URL(`/app${path}`, req.url));
  }

  // Special case for root domain
  if (hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN || hostname === "edutrac.com") {
    console.log("Redirecting to home page:", `/home${path === "/" ? "" : path}`);
    return NextResponse.rewrite(new URL(`/home${path}`, req.url));
  }

  // Add logging to see what hostname and path are being processed
  console.log("Hostname:", hostname);
  console.log("Path:", path);
  
  // Rewrite everything else to /[domain]/[slug] for school-specific pages
  return NextResponse.rewrite(new URL(`/domain${path}`, req.url));
}
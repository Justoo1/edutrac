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
  let hostname = req.headers.get("host")!;
  
  // Store original hostname for debugging
  const originalHostname = hostname;
  
  // Handle local development
  if (hostname.includes("localhost:3000")) {
    hostname = hostname.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);
  }

  // Handle Vercel preview deployments (for testing before domain switch)
  if (hostname.includes("---") && hostname.endsWith(".vercel.app")) {
    hostname = `${hostname.split("---")[0]}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;
  }

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  // Enhanced logging for debugging
  console.log("Middleware processing:");
  console.log("  Original hostname:", originalHostname);
  console.log("  Processed hostname:", hostname);
  console.log("  Path:", path);
  console.log("  Root domain:", process.env.NEXT_PUBLIC_ROOT_DOMAIN);

  // App dashboard routes (app.edtmsys.com or app.localhost:3000)
  const isAppDashboard = 
    hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` || 
    hostname === "app.localhost:3000" ||
    hostname === "app.edtmsys.com";

  if (isAppDashboard) {
    const session = await getToken({ req });
    
    // Redirect to login if not authenticated and not on auth pages
    if (!session && !path.startsWith('/login') && !path.startsWith('/register')) {
      console.log("App dashboard - redirecting to login");
      return NextResponse.redirect(new URL("/login", req.url));
    } 
    // Redirect to dashboard if authenticated and on auth pages
    else if (session && (path === '/login' || path === '/register')) {
      console.log("App dashboard - redirecting to dashboard");
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // Rewrite to app routes
    const newPath = path === '/dashboard' ? '/app/' : `/app${path}`;
    console.log("App dashboard - rewriting to:", newPath);
    return NextResponse.rewrite(new URL(newPath, req.url));
  }

  // Root domain routes (edtmsys.com or localhost:3000)
  const isRootDomain = 
    hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    hostname === "localhost:3000" ||
    hostname === "edtmsys.com";

  if (isRootDomain) {
    console.log("Root domain - rewriting to:", `/home${path === "/" ? "" : path}`);
    return NextResponse.rewrite(new URL(`/home${path === "/" ? "" : path}`, req.url));
  }

  // School subdomains (*.edtmsys.com or *.localhost:3000)
  if (hostname.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) || 
      hostname.endsWith(".localhost:3000") ||
      hostname.endsWith(".edtmsys.com")) {
    
    const subdomain = hostname.split('.')[0];
    
    // Make sure it's not the app subdomain and not the root domain
    if (subdomain && subdomain !== 'app' && subdomain !== process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split('.')[0]) {
      console.log("School domain - subdomain:", subdomain);
      console.log("School domain - rewriting to:", `/${subdomain}${path}`);
      return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
    }
  }

  // Fallback for any unmatched requests
  console.log("Middleware - no specific handler, continuing...");
  return NextResponse.next();
}
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
  
  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  // Log for debugging
  console.log("Middleware processing - Hostname:", hostname, "Path:", path);

  // Handle local development subdomain routing
  if (hostname.includes("localhost:3000")) {
    hostname = hostname.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);
    
    // App dashboard for local development
    if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` || hostname === "app.localhost:3000") {
      const session = await getToken({ req });
      
      if (!session && !path.startsWith('/login') && !path.startsWith('/register')) {
        return NextResponse.redirect(new URL("/login", req.url));
      } else if (session && (path === '/login' || path === '/register')) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      
      const newPath = path === '/dashboard' ? '/app/' : `/app${path}`;
      console.log("App dashboard route - rewriting to:", newPath);
      return NextResponse.rewrite(new URL(newPath, req.url));
    }

    // Root domain for local development
    if (hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN || hostname === "localhost:3000") {
      console.log("Root domain - rewriting to:", `/home${path === "/" ? "" : path}`);
      return NextResponse.rewrite(new URL(`/home${path === "/" ? "" : path}`, req.url));
    }

    // School subdomains for local development
    const subdomain = hostname.split('.')[0];
    if (subdomain !== 'app') {
      console.log("School domain - rewriting to:", `/${subdomain}${path}`);
      return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
    }
  }

  // Handle Vercel deployment (single domain with path-based routing)
  if (hostname.endsWith(".vercel.app")) {
    // App dashboard routes - use path-based routing for Vercel
    if (path.startsWith('/app') || path.startsWith('/dashboard') || 
        path.startsWith('/login') || path.startsWith('/register')) {
      
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
      
      // Handle dashboard path
      if (path.startsWith('/dashboard')) {
        const newPath = path === '/dashboard' ? '/app/' : path.replace('/dashboard', '/app');
        console.log("Dashboard path - rewriting to:", newPath);
        return NextResponse.rewrite(new URL(newPath, req.url));
      }
      
      // App paths and auth pages pass through
      console.log("App/Auth path - keeping as:", path);
      return NextResponse.next();
    }

    // Root domain routes
    if (path === "/" || path.startsWith("/home")) {
      const homePath = path === "/" ? "/home" : path;
      console.log("Root domain - rewriting to:", homePath);
      return NextResponse.rewrite(new URL(homePath, req.url));
    }

    // School routes (for testing with paths like /testschool)
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0];
      
      // Skip known routes
      if (!['app', 'home', 'api', 'login', 'register', 'dashboard', '_next', '_static'].includes(firstSegment)) {
        console.log("School path - rewriting to:", `/${firstSegment}${path.substring(firstSegment.length + 1)}`);
        return NextResponse.rewrite(new URL(path, req.url));
      }
    }
  }

  // Default fallback
  console.log("Middleware - continuing with default behavior");
  return NextResponse.next();
}
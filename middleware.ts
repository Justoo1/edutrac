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

  // Handle Vercel deployment URLs
  // Pattern 1: Standard Vercel deployments (project-hash.vercel.app)
  // Pattern 2: Branch deployments (project-branch-hash.vercel.app) 
  // Pattern 3: PR deployments (project-git-branch-hash.vercel.app)
  if (hostname.endsWith(".vercel.app")) {
    // Handle Vercel preview deployment URLs with --- pattern
    if (hostname.includes("---")) {
      hostname = `${hostname.split("---")[0]}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;
    }
    // Handle standard Vercel deployments
    else {
      // Extract the deployment type from Vercel URL
      const parts = hostname.replace(".vercel.app", "").split("-");
      
      // Check if it's an app deployment (starts with "app-")
      if (parts[0] === "app") {
        // This is an app deployment: app-edutrac-xyz.vercel.app
        hostname = `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;
      }
      // Check if it's a school deployment (school-project pattern)
      else if (parts.length >= 2) {
        const potentialSchool = parts[0];
        const projectName = parts.slice(1).join("-");
        
        // If the project name contains our app name, treat first part as subdomain
        if (projectName.includes("edutrac") || parts.length === 2) {
          hostname = `${potentialSchool}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;
        } else {
          // This is likely the main domain deployment
          hostname = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
        }
      }
      // Default to root domain for single-part deployments
      else {
        hostname = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
      }
    }
  }

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  // Enhanced logging for debugging
  console.log("Middleware processing:");
  console.log("  Original hostname:", originalHostname);
  console.log("  Processed hostname:", hostname);
  console.log("  Path:", path);
  console.log("  Root domain:", process.env.NEXT_PUBLIC_ROOT_DOMAIN);

  // Handle app dashboard pages
  const isAppDashboard = 
    hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` || 
    hostname === "app.localhost:3000" ||
    // Also handle direct Vercel app URLs
    (originalHostname.startsWith("app-") && originalHostname.endsWith(".vercel.app"));

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

  // Handle root domain
  const isRootDomain = 
    hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    hostname === "localhost:3000" ||
    hostname === "edutrac.com" ||
    // Handle main Vercel deployment (without subdomain prefixes)
    (originalHostname.endsWith(".vercel.app") && 
     !originalHostname.includes("-") && 
     !originalHostname.startsWith("app-"));

  if (isRootDomain) {
    console.log("Root domain - rewriting to:", `/home${path === "/" ? "" : path}`);
    return NextResponse.rewrite(new URL(`/home${path === "/" ? "" : path}`, req.url));
  }

  // Handle school subdomains
  const subdomain = hostname.split('.')[0];
  
  // Additional validation for subdomain
  if (subdomain && subdomain !== 'app' && subdomain !== process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split('.')[0]) {
    console.log("School domain - subdomain:", subdomain);
    console.log("School domain - rewriting to:", `/${subdomain}${path}`);
    return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
  }

  // Fallback - if we can't determine the type, log and continue
  console.log("Middleware - no specific handler, continuing...");
  return NextResponse.next();
}
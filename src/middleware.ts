import { NextResponse } from "next/server";

// Check if Clerk is properly configured
const isClerkConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
};

// Fallback middleware when Clerk is not configured
function fallbackMiddleware(req: Request) {
  const { pathname } = new URL(req.url);
  
  // For now, allow all routes when Clerk is not configured
  // In production, you might want to show a maintenance page
  if (pathname.startsWith("/admin") || pathname.startsWith("/barber")) {
    // Redirect to home page with a message
    const homeUrl = new URL("/", req.url);
    homeUrl.searchParams.set("message", "Authentication not configured");
    return NextResponse.redirect(homeUrl);
  }
  
  return NextResponse.next();
}

// Main middleware function
export default function middleware(req: Request) {
  // If Clerk is not configured, use fallback
  if (!isClerkConfigured()) {
    return fallbackMiddleware(req);
  }
  
  // Import and use Clerk middleware only when configured
  try {
    const { authMiddleware } = require("@clerk/nextjs/server");
    
    return authMiddleware({
      // Routes that can be accessed while signed out
      publicRoutes: [
        "/",
        "/plans",
        "/booking",
        "/api/webhooks/stripe",
        "/api/subscription-plans",
      ],
      
      // Routes that can always be accessed, and have
      // no authentication information
      ignoredRoutes: [
        "/api/webhooks/stripe",
        "/api/subscription-plans",
      ],
      
      afterAuth: (auth: any, req: Request) => {
        const { userId } = auth;
        const { pathname } = new URL(req.url);
        
        // Handle protected routes
        if ((pathname.startsWith("/admin") || pathname.startsWith("/barber")) && !userId) {
          // Redirect to sign-in with return URL
          const signInUrl = new URL("/sign-in", req.url);
          signInUrl.searchParams.set("redirect_url", pathname);
          return NextResponse.redirect(signInUrl);
        }
        
        return NextResponse.next();
      },
    })(req);
  } catch (error) {
    // If there's an error with Clerk middleware, fall back
    console.error("Clerk middleware error:", error);
    return fallbackMiddleware(req);
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

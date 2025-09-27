// import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { logger } from "./logger";

export interface CurrentUser {
  id: string;
  role: "CLIENT" | "BARBER" | "OWNER";
  email?: string;
  name?: string;
  phone?: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    // Check if Clerk is configured
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
      logger.warn("Clerk not configured, returning mock user");
      return {
        id: 'mock-user-id',
        role: 'CLIENT',
        email: 'demo@example.com',
        name: 'Demo User',
      };
    }

    // Import Clerk functions dynamically
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }
    
    // Get user from Clerk
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      logger.warn("Clerk user not found", { userId });
      return null;
    }
    
    // Get or create user in our database
    let user = await db.user.findUnique({
      where: { clerkId: userId },
    });
    
    if (!user) {
      // Create new user in database
      user = await db.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || undefined,
          phone: clerkUser.phoneNumbers[0]?.phoneNumber,
          role: "CLIENT", // Default role
        },
      });
      
      logger.info("Created new user in database", { 
        userId, 
        clerkId: userId,
        email: user.email 
      });
    }
    
    return {
      id: user.id,
      role: user.role,
      email: user.email || undefined,
      name: user.name || undefined,
      phone: user.phone || undefined,
    };
  } catch (error) {
    logger.error("Failed to get current user", error as Error, { userId: "unknown" });
    return null;
  }
}

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  return user;
}

export async function requireRole(requiredRole: "CLIENT" | "BARBER" | "OWNER"): Promise<CurrentUser> {
  const user = await requireAuth();
  
  if (user.role !== requiredRole && user.role !== "OWNER") {
    throw new Error(`Role ${requiredRole} required`);
  }
  
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  return requireRole("OWNER");
}

export async function requireBarber(): Promise<CurrentUser> {
  return requireRole("BARBER");
}

// Helper to check if user has specific role
export function hasRole(user: CurrentUser | null, role: "CLIENT" | "BARBER" | "OWNER"): boolean {
  if (!user) return false;
  return user.role === role || user.role === "OWNER";
}

// Helper to check if user is admin
export function isAdmin(user: CurrentUser | null): boolean {
  return hasRole(user, "OWNER");
}

// Helper to check if user is barber
export function isBarber(user: CurrentUser | null): boolean {
  return hasRole(user, "BARBER");
}

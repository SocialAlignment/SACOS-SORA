// Story 3.1: User Authentication - API Route Protection Middleware

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AuthUser, Role, Permission, requirePermission } from "./permissions";

/**
 * Extended NextRequest with auth context
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

/**
 * Middleware wrapper for API routes that require authentication
 * Extracts user from Clerk session and attaches to request
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized - No user session" },
          { status: 401 }
        );
      }

      // Get user from Clerk
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);

      // Extract role and tenant from public metadata
      const role = (clerkUser.publicMetadata.role as Role) || Role.VIEWER;
      const tenantId = clerkUser.publicMetadata.tenantId as string;

      if (!tenantId) {
        return NextResponse.json(
          { error: "User not assigned to tenant" },
          { status: 403 }
        );
      }

      // Create AuthUser object
      const authUser: AuthUser = {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        role,
        tenantId,
        firstName: clerkUser.firstName || undefined,
        lastName: clerkUser.lastName || undefined,
      };

      // Attach user to request
      const authReq = req as AuthenticatedRequest;
      authReq.user = authUser;

      // Execute handler
      return await handler(authReq);
    } catch (error) {
      console.error("Authentication error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware wrapper that requires specific permission
 */
export function withPermission(
  permission: Permission,
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      if (!req.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check permission
      requirePermission(req.user, permission);

      // Execute handler
      return await handler(req);
    } catch (error) {
      if (error instanceof Error && error.name === "AuthorizationError") {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      console.error("Authorization error:", error);
      return NextResponse.json(
        { error: "Authorization failed" },
        { status: 500 }
      );
    }
  });
}

/**
 * Middleware wrapper that requires any of the specified permissions
 */
export function withAnyPermission(
  permissions: Permission[],
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      if (!req.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check if user has any of the permissions
      const hasAccess = permissions.some((permission) =>
        req.user!.role && rolePermissions[req.user!.role]?.includes(permission)
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }

      // Execute handler
      return await handler(req);
    } catch (error) {
      console.error("Authorization error:", error);
      return NextResponse.json(
        { error: "Authorization failed" },
        { status: 500 }
      );
    }
  });
}

/**
 * Middleware wrapper that requires admin role
 */
export function withAdmin(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!req.user || req.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return await handler(req);
  });
}

/**
 * Helper to get current user from request
 * For use within route handlers after withAuth middleware
 */
export function getCurrentUser(req: AuthenticatedRequest): AuthUser {
  if (!req.user) {
    throw new Error("No authenticated user in request context");
  }
  return req.user;
}

// Re-export for convenience
import { rolePermissions } from "./permissions";
export { Role, Permission, AuthUser };

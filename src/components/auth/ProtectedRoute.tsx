// Story 3.1: User Authentication - Protected Route Component

"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Role, Permission, hasPermission } from "@/lib/auth/permissions";

interface ProtectedRouteProps {
  /**
   * Required permission to access route
   */
  permission?: Permission;

  /**
   * Required role to access route
   */
  role?: Role;

  /**
   * Content to render when authorized
   */
  children: ReactNode;

  /**
   * Redirect path when unauthorized (defaults to /sign-in)
   */
  redirectTo?: string;

  /**
   * Loading component while checking auth
   */
  loadingComponent?: ReactNode;
}

/**
 * Component that protects routes based on authentication and permissions
 * Redirects to sign-in or specified path if unauthorized
 *
 * Usage examples:
 *
 * // Protect entire page with permission check
 * <ProtectedRoute permission={Permission.VIEW_CAMPAIGNS}>
 *   <CampaignsPage />
 * </ProtectedRoute>
 *
 * // Require admin role
 * <ProtectedRoute role={Role.ADMIN} redirectTo="/dashboard">
 *   <AdminSettings />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  permission,
  role,
  children,
  redirectTo = "/sign-in",
  loadingComponent = <div>Loading...</div>,
}: ProtectedRouteProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // No user - redirect to sign in
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Get user's role from metadata
    const userRole = (user.publicMetadata.role as Role) || Role.VIEWER;

    // Check tenant assignment
    const tenantId = user.publicMetadata.tenantId as string;
    if (!tenantId) {
      console.error("User not assigned to tenant");
      router.push("/unauthorized");
      return;
    }

    // Check role requirement
    if (role && userRole !== role) {
      console.warn(`Access denied: required role ${role}, user has ${userRole}`);
      router.push("/unauthorized");
      return;
    }

    // Check permission requirement
    if (permission && !hasPermission(userRole, permission)) {
      console.warn(`Access denied: user lacks permission ${permission}`);
      router.push("/unauthorized");
      return;
    }
  }, [isLoaded, user, permission, role, redirectTo, router]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return <>{loadingComponent}</>;
  }

  // No user - will redirect in useEffect
  if (!user) {
    return null;
  }

  // Get user's role
  const userRole = (user.publicMetadata.role as Role) || Role.VIEWER;
  const tenantId = user.publicMetadata.tenantId as string;

  // Check tenant assignment
  if (!tenantId) {
    return null;
  }

  // Check role requirement
  if (role && userRole !== role) {
    return null;
  }

  // Check permission requirement
  if (permission && !hasPermission(userRole, permission)) {
    return null;
  }

  // Authorized - render children
  return <>{children}</>;
}

// Story 3.1: User Authentication - Permission Guard Component

"use client";

import { useUser } from "@clerk/nextjs";
import { Role, Permission, hasPermission } from "@/lib/auth/permissions";
import type { ReactNode } from "react";

interface PermissionGuardProps {
  /**
   * Required permission to view content
   */
  permission?: Permission;

  /**
   * Required role to view content
   */
  role?: Role;

  /**
   * Content to show when permission is granted
   */
  children: ReactNode;

  /**
   * Optional fallback content when permission is denied
   */
  fallback?: ReactNode;

  /**
   * If true, renders nothing when permission denied (instead of fallback)
   */
  hideIfDenied?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions
 *
 * Usage examples:
 *
 * // Check single permission
 * <PermissionGuard permission={Permission.CREATE_CAMPAIGNS}>
 *   <CreateCampaignButton />
 * </PermissionGuard>
 *
 * // Check role
 * <PermissionGuard role={Role.ADMIN}>
 *   <AdminPanel />
 * </PermissionGuard>
 *
 * // With fallback
 * <PermissionGuard
 *   permission={Permission.EDIT_CAMPAIGNS}
 *   fallback={<p>You don't have permission to edit campaigns</p>}
 * >
 *   <EditCampaignForm />
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  role,
  children,
  fallback = null,
  hideIfDenied = false,
}: PermissionGuardProps) {
  const { user, isLoaded } = useUser();

  // Wait for user data to load
  if (!isLoaded) {
    return null;
  }

  // No user - deny access
  if (!user) {
    return hideIfDenied ? null : <>{fallback}</>;
  }

  // Get user's role from metadata
  const userRole = (user.publicMetadata.role as Role) || Role.VIEWER;

  // Check role requirement
  if (role && userRole !== role) {
    return hideIfDenied ? null : <>{fallback}</>;
  }

  // Check permission requirement
  if (permission && !hasPermission(userRole, permission)) {
    return hideIfDenied ? null : <>{fallback}</>;
  }

  // Permission granted - render children
  return <>{children}</>;
}

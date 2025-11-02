// Story 3.1: User Authentication - RBAC Implementation

/**
 * Role definitions for the multi-tenant platform
 */
export enum Role {
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
}

/**
 * Granular permissions for resource access control
 */
export enum Permission {
  // Campaign Management
  VIEW_CAMPAIGNS = "view_campaigns",
  CREATE_CAMPAIGNS = "create_campaigns",
  EDIT_CAMPAIGNS = "edit_campaigns",
  DELETE_CAMPAIGNS = "delete_campaigns",

  // Video Testing
  VIEW_TESTS = "view_tests",
  CREATE_TESTS = "create_tests",
  EDIT_TESTS = "edit_tests",
  DELETE_TESTS = "delete_tests",

  // Analytics Access
  VIEW_ANALYTICS = "view_analytics",
  EXPORT_ANALYTICS = "export_analytics",

  // Notion Integration
  SYNC_NOTION = "sync_notion",
  CONFIGURE_NOTION = "configure_notion",

  // Tenant Management
  VIEW_TENANT_SETTINGS = "view_tenant_settings",
  EDIT_TENANT_SETTINGS = "edit_tenant_settings",
  MANAGE_USERS = "manage_users",
}

/**
 * Role-to-Permission mappings
 */
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // Admins have all permissions
    Permission.VIEW_CAMPAIGNS,
    Permission.CREATE_CAMPAIGNS,
    Permission.EDIT_CAMPAIGNS,
    Permission.DELETE_CAMPAIGNS,
    Permission.VIEW_TESTS,
    Permission.CREATE_TESTS,
    Permission.EDIT_TESTS,
    Permission.DELETE_TESTS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.SYNC_NOTION,
    Permission.CONFIGURE_NOTION,
    Permission.VIEW_TENANT_SETTINGS,
    Permission.EDIT_TENANT_SETTINGS,
    Permission.MANAGE_USERS,
  ],
  [Role.EDITOR]: [
    // Editors can manage campaigns and tests, view analytics
    Permission.VIEW_CAMPAIGNS,
    Permission.CREATE_CAMPAIGNS,
    Permission.EDIT_CAMPAIGNS,
    Permission.VIEW_TESTS,
    Permission.CREATE_TESTS,
    Permission.EDIT_TESTS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.SYNC_NOTION,
    Permission.VIEW_TENANT_SETTINGS,
  ],
  [Role.VIEWER]: [
    // Viewers have read-only access
    Permission.VIEW_CAMPAIGNS,
    Permission.VIEW_TESTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_TENANT_SETTINGS,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * User authorization context
 */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Authorization error class
 */
export class AuthorizationError extends Error {
  constructor(message: string = "Insufficient permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Require permission - throws if not authorized
 */
export function requirePermission(user: AuthUser, permission: Permission): void {
  if (!hasPermission(user.role, permission)) {
    throw new AuthorizationError(
      `User does not have permission: ${permission}`
    );
  }
}

/**
 * Require any permission - throws if not authorized
 */
export function requireAnyPermission(
  user: AuthUser,
  permissions: Permission[]
): void {
  if (!hasAnyPermission(user.role, permissions)) {
    throw new AuthorizationError(
      `User does not have any of the required permissions: ${permissions.join(", ")}`
    );
  }
}

/**
 * Require all permissions - throws if not authorized
 */
export function requireAllPermissions(
  user: AuthUser,
  permissions: Permission[]
): void {
  if (!hasAllPermissions(user.role, permissions)) {
    throw new AuthorizationError(
      `User does not have all required permissions: ${permissions.join(", ")}`
    );
  }
}

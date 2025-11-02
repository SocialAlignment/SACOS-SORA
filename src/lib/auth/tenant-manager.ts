// Story 3.1: User Authentication - Tenant Management

import { clerkClient } from "@clerk/nextjs/server";
import { Role } from "./permissions";
import { prisma } from "@/lib/database/prisma";

/**
 * Tenant information
 */
export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
  ownerId: string;
}

/**
 * Generate a unique tenant ID
 */
function generateTenantId(): string {
  return `tenant_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Create a new tenant for a user
 * Creates records in both PostgreSQL database and Clerk metadata
 */
export async function createTenantForUser(
  userId: string,
  email: string
): Promise<Tenant> {
  // Extract name from email (e.g., "john@agency.com" -> "Agency")
  const emailDomain = email.split("@")[1] || "Unknown";
  const tenantName = emailDomain.split(".")[0];
  const formattedTenantName =
    tenantName.charAt(0).toUpperCase() + tenantName.slice(1);

  // Get additional user info from Clerk
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const firstName = clerkUser.firstName || null;
  const lastName = clerkUser.lastName || null;

  // Create tenant and user in database (transaction ensures both succeed or fail together)
  const dbTenant = await prisma.tenant.create({
    data: {
      name: formattedTenantName,
      ownerId: userId,
      users: {
        create: {
          clerkId: userId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: Role.ADMIN, // First user becomes admin
        },
      },
    },
    include: {
      users: true,
    },
  });

  // Update Clerk user with tenant assignment (for quick access)
  await client.users.updateUser(userId, {
    publicMetadata: {
      tenantId: dbTenant.id,
      tenantName: dbTenant.name,
      role: Role.ADMIN,
    },
  });

  console.log(`Created tenant ${dbTenant.id} for user ${userId} in database`);

  return {
    id: dbTenant.id,
    name: dbTenant.name,
    createdAt: dbTenant.createdAt,
    ownerId: dbTenant.ownerId,
  };
}

/**
 * Assign a user to an existing tenant
 */
export async function assignUserToTenant(
  userId: string,
  tenantId: string,
  tenantName: string,
  role: Role = Role.VIEWER
): Promise<void> {
  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: {
      tenantId,
      tenantName,
      role,
    },
  });

  console.log(`Assigned user ${userId} to tenant ${tenantId} with role ${role}`);
}

/**
 * Get tenant information from user metadata
 */
export async function getTenantForUser(userId: string): Promise<Tenant | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const tenantId = user.publicMetadata.tenantId as string;
    const tenantName = user.publicMetadata.tenantName as string;

    if (!tenantId || !tenantName) {
      return null;
    }

    return {
      id: tenantId,
      name: tenantName,
      createdAt: new Date(user.createdAt),
      ownerId: userId,
    };
  } catch (error) {
    console.error("Error getting tenant for user:", error);
    return null;
  }
}

/**
 * Update user role within their tenant
 */
export async function updateUserRole(
  userId: string,
  newRole: Role
): Promise<void> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  await client.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      role: newRole,
    },
  });

  console.log(`Updated user ${userId} role to ${newRole}`);
}

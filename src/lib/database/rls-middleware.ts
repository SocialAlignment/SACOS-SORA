// Story 3.4: Row-Level Security Middleware
// Sets tenant context before all Prisma queries

import { prisma } from "./prisma";

/**
 * Execute a Prisma query within a tenant context
 * This sets the PostgreSQL session variables that RLS policies use
 */
export async function withTenantContext<T>(
  tenantId: string,
  userRole: string,
  callback: () => Promise<T>
): Promise<T> {
  // Set session variables for RLS
  await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
  await prisma.$executeRawUnsafe(`SET LOCAL app.user_role = '${userRole}'`);

  try {
    // Execute the query
    return await callback();
  } finally {
    // Clean up session variables
    await prisma.$executeRawUnsafe(`RESET app.current_tenant_id`);
    await prisma.$executeRawUnsafe(`RESET app.user_role`);
  }
}

/**
 * Alternative: Use a transaction to ensure session variables are isolated
 * Recommended for concurrent requests
 */
export async function withTenantTransaction<T>(
  tenantId: string,
  userRole: string,
  callback: () => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set session variables within transaction
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
    await tx.$executeRawUnsafe(`SET LOCAL app.user_role = '${userRole}'`);

    // Execute callback
    return await callback();
  });
}

/**
 * Get current tenant and role from authenticated user
 */
export interface TenantContext {
  tenantId: string;
  userRole: string;
  userId: string;
}

/**
 * Extract tenant context from Clerk session
 */
export async function getTenantContextFromClerkId(clerkId: string): Promise<TenantContext | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      tenantId: true,
      role: true,
      id: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    tenantId: user.tenantId,
    userRole: user.role,
    userId: user.id,
  };
}

/**
 * Audit log helper - logs attempts to access resources
 */
export async function logAccess(
  userId: string,
  tenantId: string,
  resource: string,
  action: string
): Promise<void> {
  await prisma.accessLog.create({
    data: {
      userId,
      tenantId,
      resource,
      action,
    },
  });
}

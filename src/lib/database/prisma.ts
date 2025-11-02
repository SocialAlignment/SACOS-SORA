// Story 3.1/3.2: Prisma Client Configuration

import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma client instance
 * Implements singleton pattern to avoid multiple instances in development
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Disconnect Prisma client on application shutdown
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Script to sync existing Clerk users to PostgreSQL database
// Run this once to create database records for users who signed up before database sync was implemented

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncExistingUsers() {
  try {
    console.log("Starting user sync from Clerk to PostgreSQL...\n");

    // Verify environment variables are loaded
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error("CLERK_SECRET_KEY not found in environment variables");
    }

    // Get all users from Clerk
    const client = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const { data: users, totalCount } = await client.users.getUserList();

    console.log(`Found ${totalCount} users in Clerk\n`);

    for (const clerkUser of users) {
      const userId = clerkUser.id;
      const email =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || "";

      console.log(`Processing user: ${email} (${userId})`);

      // Check if user already exists in database
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (existingUser) {
        console.log(`  ✓ User already exists in database, skipping\n`);
        continue;
      }

      // Extract tenant info from Clerk metadata or create new
      const metadata = clerkUser.publicMetadata as any;
      let tenantId = metadata?.tenantId;
      let tenantName = metadata?.tenantName;
      const role = metadata?.role || "admin";

      // If no tenant assigned, create one
      if (!tenantId) {
        const emailDomain = email.split("@")[1] || "Unknown";
        tenantName = emailDomain.split(".")[0];
        tenantName = tenantName.charAt(0).toUpperCase() + tenantName.slice(1);

        console.log(`  Creating new tenant: ${tenantName}`);

        // Create tenant and user in database
        const tenant = await prisma.tenant.create({
          data: {
            name: tenantName,
            ownerId: userId,
            users: {
              create: {
                clerkId: userId,
                email: email,
                firstName: clerkUser.firstName || null,
                lastName: clerkUser.lastName || null,
                role: role,
              },
            },
          },
          include: {
            users: true,
          },
        });

        tenantId = tenant.id;

        // Update Clerk metadata
        await client.users.updateUser(userId, {
          publicMetadata: {
            tenantId: tenant.id,
            tenantName: tenant.name,
            role: role,
          },
        });

        console.log(`  ✓ Created tenant: ${tenant.id}`);
        console.log(`  ✓ Created user record in database`);
        console.log(`  ✓ Updated Clerk metadata\n`);
      } else {
        // Tenant exists in metadata, ensure it exists in database
        let tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
        });

        if (!tenant) {
          console.log(`  Creating tenant from metadata: ${tenantName}`);
          tenant = await prisma.tenant.create({
            data: {
              id: tenantId,
              name: tenantName,
              ownerId: userId,
            },
          });
          console.log(`  ✓ Created tenant: ${tenant.id}`);
        }

        // Create user record
        await prisma.user.create({
          data: {
            clerkId: userId,
            email: email,
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            role: role,
            tenantId: tenantId,
          },
        });

        console.log(`  ✓ Created user record in database\n`);
      }
    }

    console.log("\n✅ Sync completed successfully!");
  } catch (error) {
    console.error("\n❌ Error during sync:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncExistingUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

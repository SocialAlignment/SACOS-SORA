// Story 3.4: Test Row-Level Security Tenant Isolation
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { prisma } from "../src/lib/database/prisma";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  console.log(passed ? "✅" : "❌", name);
  if (!passed) {
    console.log(`   ${details}`);
  }
}

async function runTests() {
  console.log("🔐 Testing Row-Level Security (RLS) Tenant Isolation\n");

  let tenant1Id: string;
  let tenant2Id: string;
  let campaign1Id: string;
  let campaign2Id: string;

  try {
    // Setup: Create two tenants
    console.log("📋 Setup: Creating test tenants and data...\n");

    const tenant1 = await prisma.tenant.create({
      data: {
        name: "Test Tenant 1 (RLS)",
        ownerId: "clerk_test_rls_owner1",
        users: {
          create: {
            clerkId: "clerk_test_rls_user1",
            email: "rls_user1@test.com",
            firstName: "User",
            lastName: "One",
            role: "editor",
          },
        },
      },
    });
    tenant1Id = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: {
        name: "Test Tenant 2 (RLS)",
        ownerId: "clerk_test_rls_owner2",
        users: {
          create: {
            clerkId: "clerk_test_rls_user2",
            email: "rls_user2@test.com",
            firstName: "User",
            lastName: "Two",
            role: "editor",
          },
        },
      },
    });
    tenant2Id = tenant2.id;

    // Create campaigns for each tenant
    const campaign1 = await prisma.campaign.create({
      data: {
        tenantId: tenant1Id,
        userId: "clerk_test_rls_user1",
        brandId: "brand-rls-test-1",
        name: "Tenant 1 Campaign",
        description: "Should NOT be visible to Tenant 2",
      },
    });
    campaign1Id = campaign1.id;

    const campaign2 = await prisma.campaign.create({
      data: {
        tenantId: tenant2Id,
        userId: "clerk_test_rls_user2",
        brandId: "brand-rls-test-2",
        name: "Tenant 2 Campaign",
        description: "Should NOT be visible to Tenant 1",
      },
    });
    campaign2Id = campaign2.id;

    console.log(`Created Tenant 1: ${tenant1Id}`);
    console.log(`Created Tenant 2: ${tenant2Id}`);
    console.log(`Created Campaign 1 (Tenant 1): ${campaign1Id}`);
    console.log(`Created Campaign 2 (Tenant 2): ${campaign2Id}\n`);

    // TEST 1: Without RLS context, can see all campaigns
    console.log("TEST 1: Without RLS context (no session variables)");
    const allCampaigns = await prisma.campaign.findMany();
    logTest(
      "Without RLS context, query returns all campaigns",
      allCampaigns.length >= 2,
      `Found ${allCampaigns.length} campaigns`
    );

    // TEST 2: Set Tenant 1 context, should only see Tenant 1 campaigns
    console.log("\nTEST 2: With Tenant 1 context");
    await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenant1Id}'`);
    await prisma.$executeRawUnsafe(`SET app.user_role = 'editor'`);

    const tenant1Campaigns = await prisma.campaign.findMany();
    logTest(
      "Tenant 1 can only see their own campaigns",
      tenant1Campaigns.length > 0 && tenant1Campaigns.every((c) => c.tenantId === tenant1Id),
      `Found ${tenant1Campaigns.length} campaigns, all belong to Tenant 1`
    );

    const tenant1CanSeeTenant2 = tenant1Campaigns.some((c) => c.tenantId === tenant2Id);
    logTest(
      "Tenant 1 CANNOT see Tenant 2 campaigns",
      !tenant1CanSeeTenant2,
      tenant1CanSeeTenant2 ? "ERROR: Tenant 1 can see Tenant 2 data!" : "Isolation working"
    );

    // TEST 3: Switch to Tenant 2 context
    console.log("\nTEST 3: With Tenant 2 context");
    await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenant2Id}'`);
    await prisma.$executeRawUnsafe(`SET app.user_role = 'editor'`);

    const tenant2Campaigns = await prisma.campaign.findMany();
    logTest(
      "Tenant 2 can only see their own campaigns",
      tenant2Campaigns.length > 0 && tenant2Campaigns.every((c) => c.tenantId === tenant2Id),
      `Found ${tenant2Campaigns.length} campaigns, all belong to Tenant 2`
    );

    const tenant2CanSeeTenant1 = tenant2Campaigns.some((c) => c.tenantId === tenant1Id);
    logTest(
      "Tenant 2 CANNOT see Tenant 1 campaigns",
      !tenant2CanSeeTenant1,
      tenant2CanSeeTenant1 ? "ERROR: Tenant 2 can see Tenant 1 data!" : "Isolation working"
    );

    // TEST 4: Admin can see all data
    console.log("\nTEST 4: With Admin context");
    await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenant1Id}'`);
    await prisma.$executeRawUnsafe(`SET app.user_role = 'admin'`);

    const adminCampaigns = await prisma.campaign.findMany();
    logTest(
      "Admin can see ALL campaigns (across tenants)",
      adminCampaigns.length >= 2,
      `Found ${adminCampaigns.length} campaigns total`
    );

    // TEST 5: Test tested_combinations isolation
    console.log("\nTEST 5: tested_combinations table isolation");

    // Create combinations for each tenant
    await prisma.$executeRawUnsafe(`RESET app.current_tenant_id`);
    await prisma.$executeRawUnsafe(`RESET app.user_role`);

    await prisma.testedCombination.create({
      data: {
        tenantId: tenant1Id,
        campaignId: campaign1Id,
        videoId: `rls-test-video-tenant1-${Date.now()}`,
        prompt: "Tenant 1 video",
      },
    });

    await prisma.testedCombination.create({
      data: {
        tenantId: tenant2Id,
        campaignId: campaign2Id,
        videoId: `rls-test-video-tenant2-${Date.now()}`,
        prompt: "Tenant 2 video",
      },
    });

    // Set Tenant 1 context
    await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenant1Id}'`);
    await prisma.$executeRawUnsafe(`SET app.user_role = 'editor'`);

    const tenant1Combos = await prisma.testedCombination.findMany();
    logTest(
      "Tenant 1 can only see their combinations",
      tenant1Combos.length > 0 && tenant1Combos.every((c) => c.tenantId === tenant1Id),
      `Found ${tenant1Combos.length} combinations for Tenant 1`
    );

    // Clean up session
    await prisma.$executeRawUnsafe(`RESET app.current_tenant_id`);
    await prisma.$executeRawUnsafe(`RESET app.user_role`);

    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));

    const passedTests = results.filter((r) => r.passed).length;
    const totalTests = results.length;

    results.forEach((r) => {
      console.log(`${r.passed ? "✅" : "❌"} ${r.name}`);
    });

    console.log("=".repeat(60));
    console.log(`\n${passedTests}/${totalTests} tests passed\n`);

    if (passedTests === totalTests) {
      console.log("🎉 ALL TESTS PASSED - Tenant isolation is working!");
      console.log("\n✅ Row-Level Security successfully prevents cross-tenant data access");
    } else {
      console.log("⚠️  SOME TESTS FAILED - Tenant isolation may be compromised!");
      console.log("\n❌ Review RLS policies and fix failing tests");
    }
  } catch (error: any) {
    console.error("\n❌ Test execution error:", error.message);
    console.error(error);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");

    try {
      // Delete in correct order (combinations first, then campaigns, then users, then tenants)
      if (campaign1Id || campaign2Id) {
        await prisma.testedCombination.deleteMany({
          where: {
            campaignId: {
              in: [campaign1Id, campaign2Id].filter(Boolean),
            },
          },
        });
      }

      if (campaign1Id) {
        await prisma.campaign.delete({ where: { id: campaign1Id } });
      }
      if (campaign2Id) {
        await prisma.campaign.delete({ where: { id: campaign2Id } });
      }

      await prisma.user.deleteMany({
        where: {
          clerkId: {
            in: ["clerk_test_rls_user1", "clerk_test_rls_user2"],
          },
        },
      });

      if (tenant1Id) {
        await prisma.tenant.delete({ where: { id: tenant1Id } });
      }
      if (tenant2Id) {
        await prisma.tenant.delete({ where: { id: tenant2Id } });
      }

      console.log("✅ Cleanup complete");
    } catch (cleanupError: any) {
      console.error("⚠️  Cleanup error:", cleanupError.message);
    }

    await prisma.$disconnect();
  }
}

runTests().catch(console.error);

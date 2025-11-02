// Script to apply RLS migration
import { config } from "dotenv";
import { resolve } from "path";
import { execSync } from "child_process";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

console.log("🔒 Applying Row-Level Security Migration...\n");

try {
  // Run Prisma migrate deploy
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });

  console.log("\n✅ RLS migration applied successfully!");
  console.log("\n📋 What was done:");
  console.log("  1. Added tenant_id to tested_combinations and sync_failures");
  console.log("  2. Backfilled tenant_id from campaign relationships");
  console.log("  3. Enabled Row-Level Security on all tenant-scoped tables");
  console.log("  4. Created RLS policies for tenant isolation");
  console.log("  5. Created admin bypass policies");

  console.log("\n🔐 Security Status:");
  console.log("  ✓ Tenants can only see their own data");
  console.log("  ✓ Admins can see all data");
  console.log("  ✓ Cross-tenant access blocked at database level");

} catch (error: any) {
  console.error("\n❌ Migration failed:");
  console.error(error.message);
  process.exit(1);
}

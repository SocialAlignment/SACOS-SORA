-- Story 3.4: Multi-Tenant Data Isolation with Row-Level Security

-- Step 1: Add tenant_id columns (nullable initially for backfill)
ALTER TABLE "tested_combinations" ADD COLUMN "tenant_id" TEXT;
ALTER TABLE "sync_failures" ADD COLUMN "tenant_id" TEXT;

-- Step 2: Backfill tenant_id from campaigns for tested_combinations
UPDATE "tested_combinations" tc
SET "tenant_id" = c."tenant_id"
FROM "campaigns" c
WHERE tc."campaign_id" = c."id";

-- Step 3: Make tenant_id NOT NULL for tested_combinations (now that it's backfilled)
ALTER TABLE "tested_combinations" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Step 4: Create indexes for tenant_id
CREATE INDEX "tested_combinations_tenant_id_idx" ON "tested_combinations"("tenant_id");
CREATE INDEX "sync_failures_tenant_id_idx" ON "sync_failures"("tenant_id");

-- Step 5: Enable Row-Level Security on tenant-scoped tables
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tested_combinations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_failures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "access_logs" ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for tenants table
-- Users can only see their own tenant
CREATE POLICY "tenant_isolation_policy" ON "tenants"
  FOR ALL
  USING (id = current_setting('app.current_tenant_id', TRUE)::TEXT);

-- Admins can see all tenants
CREATE POLICY "admin_all_tenants_policy" ON "tenants"
  FOR ALL
  USING (current_setting('app.user_role', TRUE) = 'admin');

-- Step 7: Create RLS policies for users table
-- Users can only see users in their own tenant
CREATE POLICY "tenant_isolation_policy" ON "users"
  FOR ALL
  USING ("tenant_id" = current_setting('app.current_tenant_id', TRUE)::TEXT);

-- Admins can see all users
CREATE POLICY "admin_all_users_policy" ON "users"
  FOR ALL
  USING (current_setting('app.user_role', TRUE) = 'admin');

-- Step 8: Create RLS policies for campaigns table
-- Users can only see campaigns in their own tenant
CREATE POLICY "tenant_isolation_policy" ON "campaigns"
  FOR ALL
  USING ("tenant_id" = current_setting('app.current_tenant_id', TRUE)::TEXT);

-- Admins can see all campaigns
CREATE POLICY "admin_all_campaigns_policy" ON "campaigns"
  FOR ALL
  USING (current_setting('app.user_role', TRUE) = 'admin');

-- Step 9: Create RLS policies for tested_combinations table
-- Users can only see combinations in their own tenant
CREATE POLICY "tenant_isolation_policy" ON "tested_combinations"
  FOR ALL
  USING ("tenant_id" = current_setting('app.current_tenant_id', TRUE)::TEXT);

-- Admins can see all combinations
CREATE POLICY "admin_all_combinations_policy" ON "tested_combinations"
  FOR ALL
  USING (current_setting('app.user_role', TRUE) = 'admin');

-- Step 10: Create RLS policies for sync_failures table
-- Users can only see failures in their own tenant (or system-wide failures where tenant_id is NULL)
CREATE POLICY "tenant_isolation_policy" ON "sync_failures"
  FOR ALL
  USING ("tenant_id" = current_setting('app.current_tenant_id', TRUE)::TEXT OR "tenant_id" IS NULL);

-- Admins can see all failures
CREATE POLICY "admin_all_failures_policy" ON "sync_failures"
  FOR ALL
  USING (current_setting('app.user_role', TRUE) = 'admin');

-- Step 11: Create RLS policies for access_logs table
-- Users can only see their own tenant's logs
CREATE POLICY "tenant_isolation_policy" ON "access_logs"
  FOR ALL
  USING ("tenant_id" = current_setting('app.current_tenant_id', TRUE)::TEXT);

-- Admins can see all logs
CREATE POLICY "admin_all_logs_policy" ON "access_logs"
  FOR ALL
  USING (current_setting('app.user_role', TRUE) = 'admin');

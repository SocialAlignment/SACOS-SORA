// Story 3.3: Notion Analytics Sync - Sync API Endpoint

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database/prisma";
import { syncNotionToDatabase, retryFailedSyncs, NotionSyncConfig } from "@/lib/notion/sync-service";
import { z } from "zod";

/**
 * Sync configuration schema
 */
const syncConfigSchema = z.object({
  databaseId: z.string().min(1, "Database ID is required"),
  mappings: z.object({
    videoIdProperty: z.string().min(1, "Video ID property name is required"),
    viewsProperty: z.string().optional(),
    likesProperty: z.string().optional(),
    sharesProperty: z.string().optional(),
    engagementRateProperty: z.string().optional(),
    winnerStatusProperty: z.string().optional(),
  }),
});

/**
 * POST /api/sync/notion
 * Trigger manual sync from Notion to PostgreSQL
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with tenant info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission - only admin can trigger sync
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can trigger Notion sync" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = syncConfigSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid sync configuration", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const config: NotionSyncConfig = validationResult.data;

    console.log(`Starting Notion sync for tenant ${user.tenantId}...`);

    // Run sync
    const result = await syncNotionToDatabase(config, user.tenantId);

    return NextResponse.json({
      message: "Sync completed",
      result: {
        success: result.success,
        synced: result.synced,
        failed: result.failed,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
    });
  } catch (error: any) {
    console.error("Error during Notion sync:", error);
    return NextResponse.json(
      { error: "Sync failed", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/notion
 * Get sync status and recent failures
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with tenant info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent sync failures
    const recentFailures = await prisma.syncFailure.findMany({
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get total combinations with Notion sync
    const syncedCount = await prisma.testedCombination.count({
      where: {
        notionRecordId: {
          not: null,
        },
      },
    });

    // Get recently synced combinations
    const recentSyncs = await prisma.testedCombination.findMany({
      where: {
        notionRecordId: {
          not: null,
        },
      },
      select: {
        videoId: true,
        notionRecordId: true,
        analyzedAt: true,
        organicMetrics: true,
      },
      orderBy: {
        analyzedAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      status: {
        totalSynced: syncedCount,
        pendingFailures: recentFailures.length,
      },
      recentSyncs,
      recentFailures: recentFailures.map((f) => ({
        id: f.id,
        videoId: f.videoId,
        error: f.error,
        retryCount: f.retryCount,
        nextRetryAt: f.nextRetryAt,
        createdAt: f.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching sync status:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync status", message: error.message },
      { status: 500 }
    );
  }
}

// Story 3.3: Notion Analytics Sync - Retry Failed Syncs

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database/prisma";
import { retryFailedSyncs } from "@/lib/notion/sync-service";

/**
 * POST /api/sync/notion/retry
 * Retry failed Notion syncs
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

    // Check permission - only admin can retry syncs
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can retry failed syncs" },
        { status: 403 }
      );
    }

    console.log("Retrying failed Notion syncs...");

    const retriedCount = await retryFailedSyncs(10);

    return NextResponse.json({
      message: "Retry completed",
      retriedCount,
    });
  } catch (error: any) {
    console.error("Error retrying failed syncs:", error);
    return NextResponse.json(
      { error: "Retry failed", message: error.message },
      { status: 500 }
    );
  }
}

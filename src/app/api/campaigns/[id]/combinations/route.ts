// Story 3.2: Campaign Analytics Backend - Tested Combinations API

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database/prisma";
import { z } from "zod";

/**
 * Tested combination creation schema
 */
const createCombinationSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
  prompt: z.string().min(1, "Prompt is required"),
  stylePreset: z.string().optional(),
  aspectRatio: z.string().optional(),
  duration: z.number().int().positive().optional(),
  notionRecordId: z.string().optional(),
  organicMetrics: z
    .object({
      views: z.number().optional(),
      likes: z.number().optional(),
      shares: z.number().optional(),
      engagement_rate: z.number().optional(),
      last_updated: z.string().optional(),
    })
    .optional(),
  winnerStatus: z.boolean().default(false),
});

/**
 * POST /api/campaigns/[id]/combinations
 * Add a tested combination to a campaign
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Get user with tenant info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission - only admin and editor can create combinations
    if (user.role !== "admin" && user.role !== "editor") {
      return NextResponse.json(
        { error: "Insufficient permissions to add test combinations" },
        { status: 403 }
      );
    }

    // Verify campaign exists and belongs to user's tenant
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId: user.tenantId,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createCombinationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if videoId already exists
    const existingCombination = await prisma.testedCombination.findUnique({
      where: { videoId: data.videoId },
    });

    if (existingCombination) {
      return NextResponse.json(
        { error: "A combination with this video ID already exists" },
        { status: 409 }
      );
    }

    // Create combination (Story 3.4: include tenantId for RLS)
    const combination = await prisma.testedCombination.create({
      data: {
        tenantId: campaign.tenantId, // Story 3.4: For Row-Level Security
        campaignId,
        videoId: data.videoId,
        prompt: data.prompt,
        stylePreset: data.stylePreset,
        aspectRatio: data.aspectRatio,
        duration: data.duration,
        notionRecordId: data.notionRecordId,
        organicMetrics: data.organicMetrics,
        winnerStatus: data.winnerStatus,
        analyzedAt: data.organicMetrics ? new Date() : null,
      },
    });

    return NextResponse.json(
      {
        message: "Tested combination added successfully",
        combination: {
          id: combination.id,
          videoId: combination.videoId,
          prompt: combination.prompt,
          stylePreset: combination.stylePreset,
          aspectRatio: combination.aspectRatio,
          duration: combination.duration,
          winnerStatus: combination.winnerStatus,
          organicMetrics: combination.organicMetrics,
          createdAt: combination.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding tested combination:", error);
    return NextResponse.json(
      { error: "Failed to add tested combination" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/campaigns/[id]/combinations
 * List all tested combinations for a campaign
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Get user with tenant info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify campaign exists and belongs to user's tenant
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId: user.tenantId,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const winnerOnly = searchParams.get("winnerOnly") === "true";

    // Build query
    const where: any = {
      campaignId,
    };

    if (winnerOnly) {
      where.winnerStatus = true;
    }

    // Fetch combinations
    const combinations = await prisma.testedCombination.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      combinations,
      total: combinations.length,
      winners: combinations.filter((c) => c.winnerStatus).length,
    });
  } catch (error) {
    console.error("Error fetching combinations:", error);
    return NextResponse.json(
      { error: "Failed to fetch combinations" },
      { status: 500 }
    );
  }
}

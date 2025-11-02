// Story 3.2: Campaign Analytics Backend - Individual Campaign Operations

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database/prisma";
import { z } from "zod";

/**
 * Campaign update schema
 */
const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "completed"]).optional(),
});

/**
 * GET /api/campaigns/[id]
 * Get a specific campaign by ID
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

    const { id } = await params;

    // Get user with tenant info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch campaign with tenant check
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        tenantId: user.tenantId, // Ensure user can only access their tenant's campaigns
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        combinations: {
          select: {
            id: true,
            videoId: true,
            prompt: true,
            stylePreset: true,
            aspectRatio: true,
            duration: true,
            winnerStatus: true,
            organicMetrics: true,
            analyzedAt: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        brandId: campaign.brandId,
        status: campaign.status,
        createdBy: campaign.user.email,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        combinations: campaign.combinations,
        totalCombinations: campaign.combinations.length,
        winningCombinations: campaign.combinations.filter((c) => c.winnerStatus).length,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/campaigns/[id]
 * Update a campaign
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user with tenant info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission - only admin and editor can update campaigns
    if (user.role !== "admin" && user.role !== "editor") {
      return NextResponse.json(
        { error: "Insufficient permissions to update campaigns" },
        { status: 403 }
      );
    }

    // Verify campaign exists and belongs to user's tenant
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = updateCampaignSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Update campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: validationResult.data,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Campaign updated successfully",
      campaign: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        description: updatedCampaign.description,
        brandId: updatedCampaign.brandId,
        status: updatedCampaign.status,
        createdBy: updatedCampaign.user.email,
        createdAt: updatedCampaign.createdAt,
        updatedAt: updatedCampaign.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete a campaign
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user with tenant info
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission - only admin can delete campaigns
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete campaigns" },
        { status: 403 }
      );
    }

    // Verify campaign exists and belongs to user's tenant
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    // Delete campaign (cascade will delete associated combinations)
    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Campaign deleted successfully",
      campaignId: id,
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

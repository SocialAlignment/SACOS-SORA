// Story 3.2: Campaign Analytics Backend - Campaign CRUD API

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database/prisma";
import { Permission } from "@/lib/auth/permissions";
import { z } from "zod";

/**
 * Campaign creation schema
 */
const createCampaignSchema = z.object({
  brandId: z.string().min(1, "Brand ID is required"),
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "completed"]).default("active"),
});

/**
 * GET /api/campaigns
 * List all campaigns for the authenticated user's tenant
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
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission
    if (user.role !== "admin" && user.role !== "editor" && user.role !== "viewer") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const brandId = searchParams.get("brandId");

    // Build query filters
    const where: any = {
      tenantId: user.tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    // Fetch campaigns with combination counts
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            combinations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        brandId: campaign.brandId,
        status: campaign.status,
        createdBy: campaign.user.email,
        combinationCount: campaign._count.combinations,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      })),
      total: campaigns.length,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign
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

    // Check permission - only admin and editor can create campaigns
    if (user.role !== "admin" && user.role !== "editor") {
      return NextResponse.json(
        { error: "Insufficient permissions to create campaigns" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createCampaignSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { brandId, name, description, status } = validationResult.data;

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        tenantId: user.tenantId,
        userId: userId,
        brandId,
        name,
        description,
        status,
      },
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

    return NextResponse.json(
      {
        message: "Campaign created successfully",
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          brandId: campaign.brandId,
          status: campaign.status,
          createdBy: campaign.user.email,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

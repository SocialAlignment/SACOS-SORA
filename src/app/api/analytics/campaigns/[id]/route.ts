// Story 3.2: Campaign Analytics Backend - Analytics API

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database/prisma";

/**
 * Helper to safely extract metric from organicMetrics JSON
 */
function getMetricValue(metrics: any, key: string): number {
  if (!metrics || typeof metrics !== "object") return 0;
  const value = metrics[key];
  return typeof value === "number" ? value : 0;
}

/**
 * GET /api/analytics/campaigns/[id]
 * Get comprehensive analytics for a campaign
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
      include: {
        combinations: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    // Calculate analytics
    const totalCombinations = campaign.combinations.length;
    const winnersCount = campaign.combinations.filter((c) => c.winnerStatus).length;
    const combinationsWithMetrics = campaign.combinations.filter(
      (c) => c.organicMetrics && c.analyzedAt
    ).length;

    // Aggregate metrics
    let totalViews = 0;
    let totalLikes = 0;
    let totalShares = 0;
    let totalEngagementRate = 0;
    let metricsCount = 0;

    campaign.combinations.forEach((combination) => {
      if (combination.organicMetrics) {
        const metrics = combination.organicMetrics as any;
        totalViews += getMetricValue(metrics, "views");
        totalLikes += getMetricValue(metrics, "likes");
        totalShares += getMetricValue(metrics, "shares");
        totalEngagementRate += getMetricValue(metrics, "engagement_rate");
        metricsCount++;
      }
    });

    const avgEngagementRate = metricsCount > 0 ? totalEngagementRate / metricsCount : 0;

    // Find top performers
    const topPerformers = campaign.combinations
      .filter((c) => c.organicMetrics)
      .map((c) => {
        const metrics = c.organicMetrics as any;
        return {
          videoId: c.videoId,
          prompt: c.prompt,
          views: getMetricValue(metrics, "views"),
          likes: getMetricValue(metrics, "likes"),
          shares: getMetricValue(metrics, "shares"),
          engagementRate: getMetricValue(metrics, "engagement_rate"),
          winnerStatus: c.winnerStatus,
        };
      })
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 5);

    // Breakdown by style preset
    const stylePresetBreakdown = campaign.combinations.reduce((acc: any, c) => {
      const style = c.stylePreset || "no-style";
      if (!acc[style]) {
        acc[style] = {
          count: 0,
          totalViews: 0,
          totalLikes: 0,
          totalShares: 0,
          avgEngagementRate: 0,
          metricsCount: 0,
        };
      }
      acc[style].count++;
      if (c.organicMetrics) {
        const metrics = c.organicMetrics as any;
        acc[style].totalViews += getMetricValue(metrics, "views");
        acc[style].totalLikes += getMetricValue(metrics, "likes");
        acc[style].totalShares += getMetricValue(metrics, "shares");
        acc[style].avgEngagementRate += getMetricValue(metrics, "engagement_rate");
        acc[style].metricsCount++;
      }
      return acc;
    }, {});

    // Calculate averages for style presets
    Object.keys(stylePresetBreakdown).forEach((style) => {
      const data = stylePresetBreakdown[style];
      if (data.metricsCount > 0) {
        data.avgEngagementRate = data.avgEngagementRate / data.metricsCount;
      }
    });

    // Breakdown by aspect ratio
    const aspectRatioBreakdown = campaign.combinations.reduce((acc: any, c) => {
      const ratio = c.aspectRatio || "unknown";
      if (!acc[ratio]) {
        acc[ratio] = {
          count: 0,
          totalViews: 0,
          totalLikes: 0,
          avgEngagementRate: 0,
          metricsCount: 0,
        };
      }
      acc[ratio].count++;
      if (c.organicMetrics) {
        const metrics = c.organicMetrics as any;
        acc[ratio].totalViews += getMetricValue(metrics, "views");
        acc[ratio].totalLikes += getMetricValue(metrics, "likes");
        acc[ratio].avgEngagementRate += getMetricValue(metrics, "engagement_rate");
        acc[ratio].metricsCount++;
      }
      return acc;
    }, {});

    // Calculate averages for aspect ratios
    Object.keys(aspectRatioBreakdown).forEach((ratio) => {
      const data = aspectRatioBreakdown[ratio];
      if (data.metricsCount > 0) {
        data.avgEngagementRate = data.avgEngagementRate / data.metricsCount;
      }
    });

    // Performance over time (grouped by week)
    const performanceTimeline = campaign.combinations
      .filter((c) => c.analyzedAt)
      .sort((a, b) => {
        const dateA = a.analyzedAt ? new Date(a.analyzedAt).getTime() : 0;
        const dateB = b.analyzedAt ? new Date(b.analyzedAt).getTime() : 0;
        return dateA - dateB;
      })
      .map((c) => ({
        date: c.analyzedAt,
        videoId: c.videoId,
        metrics: c.organicMetrics,
      }));

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        brandId: campaign.brandId,
        status: campaign.status,
      },
      overview: {
        totalCombinations,
        winnersCount,
        combinationsWithMetrics,
        totalViews,
        totalLikes,
        totalShares,
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      },
      topPerformers,
      breakdowns: {
        byStylePreset: stylePresetBreakdown,
        byAspectRatio: aspectRatioBreakdown,
      },
      performanceTimeline,
      insights: {
        bestStylePreset:
          Object.keys(stylePresetBreakdown).sort(
            (a, b) =>
              stylePresetBreakdown[b].avgEngagementRate -
              stylePresetBreakdown[a].avgEngagementRate
          )[0] || null,
        bestAspectRatio:
          Object.keys(aspectRatioBreakdown).sort(
            (a, b) =>
              aspectRatioBreakdown[b].avgEngagementRate -
              aspectRatioBreakdown[a].avgEngagementRate
          )[0] || null,
        conversionRate:
          totalCombinations > 0
            ? Math.round((winnersCount / totalCombinations) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// Test script for Notion sync
// This creates test data matching the Notion database sample rows

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const NOTION_DATABASE_ID = "586008f80be74a4486d81693c551f6d1";

async function testNotionSync() {
  console.log("🧪 Testing Notion Sync Integration\n");
  console.log("Step 1: Creating test combinations in database...\n");

  // First, we need a campaign ID. Let's use the test campaign from earlier
  // or create a new one specifically for Notion sync testing

  const campaignRes = await fetch("http://localhost:3000/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brandId: "social-alignment",
      name: "Notion Sync Test Campaign",
      description: "Testing Notion sync integration with sample data",
      status: "active",
    }),
  });

  if (!campaignRes.ok) {
    console.error("❌ Failed to create campaign:", await campaignRes.text());
    return;
  }

  const campaignData = await campaignRes.json();
  const campaignId = campaignData.campaign.id;
  console.log(`✅ Created campaign: ${campaignId}\n`);

  // Sample video IDs that should match Notion database entries
  // These need to match EXACTLY what's in your Notion database
  const testCombinations = [
    {
      videoId: "sora-test-vid-001",
      prompt: "A modern tech startup office with creative team collaboration",
      stylePreset: "cinematic",
      aspectRatio: "16:9",
      duration: 5,
    },
    {
      videoId: "sora-test-vid-002",
      prompt: "Dynamic product showcase with smooth camera movements",
      stylePreset: "vivid",
      aspectRatio: "9:16",
      duration: 7,
    },
    {
      videoId: "sora-test-vid-003",
      prompt: "Lifestyle brand aesthetic with warm lighting",
      stylePreset: "natural",
      aspectRatio: "1:1",
      duration: 6,
    },
    {
      videoId: "sora-test-vid-004",
      prompt: "Fast-paced action sequence with vibrant colors",
      stylePreset: "vivid",
      aspectRatio: "16:9",
      duration: 8,
    },
    {
      videoId: "sora-test-vid-005",
      prompt: "Calm meditation scene in nature",
      stylePreset: "natural",
      aspectRatio: "4:3",
      duration: 10,
    },
  ];

  // Create combinations
  for (const combo of testCombinations) {
    const res = await fetch(`http://localhost:3000/api/campaigns/${campaignId}/combinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(combo),
    });

    if (res.ok) {
      console.log(`✅ Created combination: ${combo.videoId}`);
    } else {
      console.error(`❌ Failed to create ${combo.videoId}:`, await res.text());
    }
  }

  console.log("\nStep 2: Triggering Notion sync...\n");

  // Trigger Notion sync
  const syncRes = await fetch("http://localhost:3000/api/sync/notion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      databaseId: NOTION_DATABASE_ID,
      mappings: {
        videoIdProperty: "Video ID",
        viewsProperty: "Views",
        likesProperty: "Likes",
        sharesProperty: "Shares",
        engagementRateProperty: "Engagement Rate",
        winnerStatusProperty: "Winner",
      },
    }),
  });

  if (!syncRes.ok) {
    console.error("❌ Sync failed:", await syncRes.text());
    return;
  }

  const syncResult = await syncRes.json();
  console.log("📊 Sync Results:");
  console.log(JSON.stringify(syncResult, null, 2));

  console.log("\nStep 3: Fetching analytics to verify sync...\n");

  // Get analytics
  const analyticsRes = await fetch(`http://localhost:3000/api/analytics/campaigns/${campaignId}`);

  if (analyticsRes.ok) {
    const analytics = await analyticsRes.json();
    console.log("📈 Analytics Overview:");
    console.log(`  Total Views: ${analytics.overview.totalViews}`);
    console.log(`  Total Likes: ${analytics.overview.totalLikes}`);
    console.log(`  Total Shares: ${analytics.overview.totalShares}`);
    console.log(`  Avg Engagement: ${analytics.overview.avgEngagementRate}%`);
    console.log(`\n🏆 Top Performers:`);
    analytics.topPerformers.slice(0, 3).forEach((p: any, i: number) => {
      console.log(`  ${i + 1}. ${p.videoId} - ${p.engagementRate}% engagement`);
    });
  }

  console.log("\n✅ Test Complete!");
  console.log(`\nCampaign ID for reference: ${campaignId}`);
}

testNotionSync().catch(console.error);

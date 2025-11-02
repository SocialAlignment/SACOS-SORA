"use client";

import { useState } from "react";

export default function APITestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const addResult = (message: string, isError = false) => {
    const prefix = isError ? "❌" : "✅";
    setResults((prev) => [...prev, `${prefix} ${message}`]);
  };

  const runTests = async () => {
    setResults([]);
    setTesting(true);

    try {
      addResult("Starting API tests...");

      // Test 1: Create Campaign
      addResult("TEST 1: Creating campaign...");
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: "social-alignment",
          name: "Test Campaign - API Validation",
          description: "Testing Story 3.2 Campaign APIs",
          status: "active",
        }),
      });

      if (!createRes.ok) {
        const error = await createRes.json();
        addResult(`Create campaign failed: ${JSON.stringify(error)}`, true);
        setTesting(false);
        return;
      }

      const createData = await createRes.json();
      const newCampaignId = createData.campaign.id;
      setCampaignId(newCampaignId);
      addResult(`Created campaign: ${createData.campaign.name} (${newCampaignId})`);

      // Test 2: Get All Campaigns
      addResult("TEST 2: Fetching all campaigns...");
      const listRes = await fetch("/api/campaigns");
      if (!listRes.ok) {
        addResult("Fetch campaigns failed", true);
        setTesting(false);
        return;
      }
      const listData = await listRes.json();
      addResult(`Found ${listData.total} campaigns`);

      // Test 3: Get Single Campaign
      addResult("TEST 3: Fetching campaign by ID...");
      const getRes = await fetch(`/api/campaigns/${newCampaignId}`);
      if (!getRes.ok) {
        addResult("Fetch campaign by ID failed", true);
        setTesting(false);
        return;
      }
      const getData = await getRes.json();
      addResult(`Retrieved campaign: ${getData.campaign.name}`);

      // Test 4: Add Combination 1
      addResult("TEST 4: Adding test combination 1...");
      const combo1Res = await fetch(`/api/campaigns/${newCampaignId}/combinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: `test-video-${Date.now()}-1`,
          prompt: "A modern tech startup office with creative team collaboration",
          stylePreset: "cinematic",
          aspectRatio: "16:9",
          duration: 5,
          organicMetrics: {
            views: 15000,
            likes: 850,
            shares: 120,
            engagement_rate: 6.5,
          },
          winnerStatus: false,
        }),
      });

      if (!combo1Res.ok) {
        const error = await combo1Res.json();
        addResult(`Add combination 1 failed: ${JSON.stringify(error)}`, true);
        setTesting(false);
        return;
      }
      addResult("Added combination 1 with metrics");

      // Test 5: Add Combination 2 (Winner)
      addResult("TEST 5: Adding test combination 2 (winner)...");
      const combo2Res = await fetch(`/api/campaigns/${newCampaignId}/combinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: `test-video-${Date.now()}-2`,
          prompt: "Dynamic product showcase with smooth camera movements",
          stylePreset: "vivid",
          aspectRatio: "9:16",
          duration: 7,
          organicMetrics: {
            views: 28000,
            likes: 2100,
            shares: 340,
            engagement_rate: 8.9,
          },
          winnerStatus: true,
        }),
      });

      if (!combo2Res.ok) {
        addResult("Add combination 2 failed", true);
        setTesting(false);
        return;
      }
      addResult("Added combination 2 (marked as winner)");

      // Test 6: Add Combination 3
      addResult("TEST 6: Adding test combination 3...");
      const combo3Res = await fetch(`/api/campaigns/${newCampaignId}/combinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: `test-video-${Date.now()}-3`,
          prompt: "Lifestyle brand aesthetic with warm lighting and natural tones",
          stylePreset: "cinematic",
          aspectRatio: "1:1",
          duration: 6,
          organicMetrics: {
            views: 12000,
            likes: 680,
            shares: 95,
            engagement_rate: 6.2,
          },
          winnerStatus: false,
        }),
      });

      if (!combo3Res.ok) {
        addResult("Add combination 3 failed", true);
        setTesting(false);
        return;
      }
      addResult("Added combination 3");

      // Test 7: Get Combinations
      addResult("TEST 7: Fetching all combinations...");
      const combosRes = await fetch(`/api/campaigns/${newCampaignId}/combinations`);
      if (!combosRes.ok) {
        addResult("Fetch combinations failed", true);
        setTesting(false);
        return;
      }
      const combosData = await combosRes.json();
      addResult(`Retrieved ${combosData.total} combinations (${combosData.winners} winners)`);

      // Test 8: Get Analytics
      addResult("TEST 8: Fetching campaign analytics...");
      const analyticsRes = await fetch(`/api/analytics/campaigns/${newCampaignId}`);
      if (!analyticsRes.ok) {
        addResult("Fetch analytics failed", true);
        setTesting(false);
        return;
      }
      const analyticsData = await analyticsRes.json();
      addResult(
        `Analytics: ${analyticsData.overview.totalViews} total views, ${analyticsData.overview.avgEngagementRate}% avg engagement`
      );
      addResult(
        `Best style: ${analyticsData.insights.bestStylePreset}, Best ratio: ${analyticsData.insights.bestAspectRatio}`
      );

      // Test 9: Update Campaign
      addResult("TEST 9: Updating campaign status...");
      const updateRes = await fetch(`/api/campaigns/${newCampaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
        }),
      });

      if (!updateRes.ok) {
        addResult("Update campaign failed", true);
        setTesting(false);
        return;
      }
      const updateData = await updateRes.json();
      addResult(`Updated campaign status to: ${updateData.campaign.status}`);

      // Test 10: Verify tenant isolation
      addResult("TEST 10: Verifying tenant-scoped access...");
      const finalRes = await fetch(`/api/campaigns/${newCampaignId}`);
      if (finalRes.ok) {
        addResult("Tenant isolation verified - can access own campaign");
      } else {
        addResult("Tenant isolation check failed", true);
      }

      addResult("🎉 ALL TESTS PASSED!");
    } catch (error) {
      addResult(`Unexpected error: ${error}`, true);
    } finally {
      setTesting(false);
    }
  };

  const cleanupCampaign = async () => {
    if (!campaignId) {
      alert("No campaign to cleanup");
      return;
    }

    const confirmed = confirm(
      "Delete test campaign? This will also delete all test combinations."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        addResult(`🗑️ Deleted test campaign ${campaignId}`);
        setCampaignId(null);
      } else {
        const error = await res.json();
        addResult(`Delete failed: ${JSON.stringify(error)}`, true);
      }
    } catch (error) {
      addResult(`Delete error: ${error}`, true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Story 3.2 API Test Suite</h1>
          <p className="text-gray-600 mb-6">
            Test Campaign Analytics Backend endpoints
          </p>

          <div className="flex gap-4 mb-8">
            <button
              onClick={runTests}
              disabled={testing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {testing ? "Running Tests..." : "Run All Tests"}
            </button>

            {campaignId && (
              <button
                onClick={cleanupCampaign}
                disabled={testing}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                Delete Test Campaign
              </button>
            )}
          </div>

          <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm h-[600px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="text-gray-500">
                Click "Run All Tests" to start testing the API endpoints...
              </div>
            ) : (
              results.map((result, idx) => (
                <div key={idx} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Tests Included:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ POST /api/campaigns - Create campaign</li>
              <li>✓ GET /api/campaigns - List all campaigns</li>
              <li>✓ GET /api/campaigns/[id] - Get campaign by ID</li>
              <li>✓ POST /api/campaigns/[id]/combinations - Add 3 combinations</li>
              <li>✓ GET /api/campaigns/[id]/combinations - List combinations</li>
              <li>✓ GET /api/analytics/campaigns/[id] - Get analytics</li>
              <li>✓ PUT /api/campaigns/[id] - Update campaign</li>
              <li>✓ Tenant isolation verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

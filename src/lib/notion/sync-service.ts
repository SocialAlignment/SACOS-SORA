// Story 3.3: Notion Analytics Sync - Sync Service

import { Client } from "@notionhq/client";
import { prisma } from "@/lib/database/prisma";

/**
 * Notion sync configuration
 */
export interface NotionSyncConfig {
  databaseId: string; // Notion database ID to sync from
  mappings: {
    // Map Notion properties to our schema
    videoIdProperty: string; // Name of Notion property containing video ID
    viewsProperty?: string;
    likesProperty?: string;
    sharesProperty?: string;
    engagementRateProperty?: string;
    winnerStatusProperty?: string;
  };
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{
    videoId?: string;
    notionPageId: string;
    error: string;
  }>;
}

/**
 * Initialize Notion client
 */
export function createNotionClient(): Client {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error("NOTION_TOKEN environment variable not set");
  }

  return new Client({ auth: token });
}

/**
 * Extract value from Notion property
 */
function getPropertyValue(property: any, type: "number" | "checkbox" | "rich_text" | "title"): any {
  if (!property) return null;

  switch (type) {
    case "number":
      return property.number;
    case "checkbox":
      return property.checkbox;
    case "rich_text":
      return property.rich_text?.[0]?.plain_text || null;
    case "title":
      return property.title?.[0]?.plain_text || null;
    default:
      return null;
  }
}

/**
 * Sync data from Notion to PostgreSQL
 */
export async function syncNotionToDatabase(
  config: NotionSyncConfig,
  tenantId?: string
): Promise<SyncResult> {
  const notion = createNotionClient();
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Query Notion database
    const response = await notion.databases.query({
      database_id: config.databaseId,
      page_size: 100, // Adjust as needed
    });

    console.log(`Found ${response.results.length} pages in Notion database`);

    // Process each page
    for (const page of response.results) {
      if (page.object !== "page" || !("properties" in page)) continue;

      const pageId = page.id;
      const props = page.properties;

      try {
        // Extract video ID
        const videoId = getPropertyValue(
          props[config.mappings.videoIdProperty],
          "rich_text"
        ) || getPropertyValue(
          props[config.mappings.videoIdProperty],
          "title"
        );

        if (!videoId) {
          result.errors.push({
            notionPageId: pageId,
            error: `No video ID found in property '${config.mappings.videoIdProperty}'`,
          });
          result.failed++;
          continue;
        }

        // Extract metrics
        const views = config.mappings.viewsProperty
          ? getPropertyValue(props[config.mappings.viewsProperty], "number")
          : null;

        const likes = config.mappings.likesProperty
          ? getPropertyValue(props[config.mappings.likesProperty], "number")
          : null;

        const shares = config.mappings.sharesProperty
          ? getPropertyValue(props[config.mappings.sharesProperty], "number")
          : null;

        const engagementRate = config.mappings.engagementRateProperty
          ? getPropertyValue(props[config.mappings.engagementRateProperty], "number")
          : null;

        const winnerStatus = config.mappings.winnerStatusProperty
          ? getPropertyValue(props[config.mappings.winnerStatusProperty], "checkbox")
          : false;

        // Build organic metrics object
        const organicMetrics = {
          views: views || 0,
          likes: likes || 0,
          shares: shares || 0,
          engagement_rate: engagementRate || 0,
          last_updated: new Date().toISOString(),
        };

        // Find existing combination by videoId
        const existing = await prisma.testedCombination.findUnique({
          where: { videoId },
        });

        if (existing) {
          // Update existing combination
          await prisma.testedCombination.update({
            where: { videoId },
            data: {
              notionRecordId: pageId,
              organicMetrics,
              winnerStatus,
              analyzedAt: new Date(),
            },
          });

          console.log(`✓ Updated combination: ${videoId}`);
          result.synced++;
        } else {
          // Log that we found a Notion record without a matching combination
          console.log(`⚠ Notion record ${videoId} not found in database - skipping`);
          result.errors.push({
            videoId,
            notionPageId: pageId,
            error: "Video combination not found in database",
          });
          result.failed++;
        }
      } catch (error: any) {
        console.error(`Error processing page ${pageId}:`, error);
        result.errors.push({
          notionPageId: pageId,
          error: error.message || "Unknown error",
        });
        result.failed++;

        // Store sync failure for retry (Story 3.4: include tenantId if available)
        await prisma.syncFailure.create({
          data: {
            tenantId: tenantId || null, // Story 3.4: For RLS
            videoId: "unknown",
            payload: { pageId, error: error.message },
            error: error.message || "Unknown error",
            retryCount: 0,
            nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
          },
        });
      }
    }

    result.success = result.failed === 0;
    return result;
  } catch (error: any) {
    console.error("Notion sync failed:", error);
    return {
      success: false,
      synced: 0,
      failed: 0,
      errors: [
        {
          notionPageId: "N/A",
          error: error.message || "Failed to query Notion database",
        },
      ],
    };
  }
}

/**
 * Retry failed syncs
 */
export async function retryFailedSyncs(limit = 10): Promise<number> {
  const failures = await prisma.syncFailure.findMany({
    where: {
      nextRetryAt: {
        lte: new Date(),
      },
    },
    take: limit,
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Retrying ${failures.length} failed syncs...`);

  let retried = 0;

  for (const failure of failures) {
    try {
      // Attempt to re-process
      // In a real implementation, you'd re-run the sync for this specific record

      // For now, just increment retry count or delete if too many retries
      if (failure.retryCount >= 3) {
        // Give up after 3 retries
        await prisma.syncFailure.delete({
          where: { id: failure.id },
        });
        console.log(`Gave up on sync failure ${failure.id} after 3 retries`);
      } else {
        // Increment retry count and schedule next retry
        await prisma.syncFailure.update({
          where: { id: failure.id },
          data: {
            retryCount: failure.retryCount + 1,
            nextRetryAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          },
        });
        retried++;
      }
    } catch (error) {
      console.error(`Error retrying sync failure ${failure.id}:`, error);
    }
  }

  return retried;
}

// Notion Database Integration for Sora 2 Content Pipeline

import { Client } from '@notionhq/client';

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Your database ID from the URL
const DATABASE_ID = '2856b72fa7658053967dfcd957ca74e6';

export interface NotionPrompt {
  id: string;
  promptId: string;
  finalSoraPrompt: string;
  researchData: string;
  brandAlignmentNotes: string;
  videoStatus: 'Draft' | 'Ready' | 'Generating' | 'Generated' | 'Published' | 'Failed';
  targetPlatform: string[];
  caption: string;
  hashtags: string;
  scheduledDate: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  generationCost?: number;
  contentCategory: string;
  promptVersion: number;
}

/**
 * Fetch ready prompts from Notion database
 */
export async function fetchReadyPrompts(): Promise<NotionPrompt[]> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: 'Video Status',
            select: {
              equals: 'Ready',
            },
          },
          {
            property: 'Webhook Trigger',
            checkbox: {
              equals: true,
            },
          },
        ],
      },
      sorts: [
        {
          property: 'Created Date',
          direction: 'descending',
        },
      ],
    });

    return response.results.map(parseNotionPage);
  } catch (error) {
    console.error('Error fetching Notion prompts:', error);
    return [];
  }
}

/**
 * Update prompt status in Notion
 */
export async function updatePromptStatus(
  pageId: string,
  status: NotionPrompt['videoStatus'],
  videoUrl?: string,
  thumbnailUrl?: string,
  cost?: number
) {
  try {
    const updateData: any = {
      'Video Status': {
        select: {
          name: status,
        },
      },
    };

    if (videoUrl) {
      updateData['Video URL'] = {
        url: videoUrl,
      };
    }

    if (thumbnailUrl) {
      updateData['Thumbnail URL'] = {
        url: thumbnailUrl,
      };
    }

    if (cost !== undefined) {
      updateData['Generation Cost'] = {
        number: cost,
      };
    }

    if (status === 'Generating' || status === 'Generated') {
      updateData['Webhook Trigger'] = {
        checkbox: false,
      };
    }

    await notion.pages.update({
      page_id: pageId,
      properties: updateData,
    });

    return true;
  } catch (error) {
    console.error('Error updating Notion prompt:', error);
    return false;
  }
}

/**
 * Get today's scheduled content
 */
export async function getTodaysContent(): Promise<NotionPrompt[]> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Scheduled Date',
        date: {
          equals: today,
        },
      },
    });

    return response.results.map(parseNotionPage);
  } catch (error) {
    console.error('Error fetching today\'s content:', error);
    return [];
  }
}

/**
 * Parse Notion page to our interface
 */
function parseNotionPage(page: any): NotionPrompt {
  const properties = page.properties;

  return {
    id: page.id,
    promptId: getTextProperty(properties['Prompt ID']),
    finalSoraPrompt: getTextProperty(properties['Final Sora Prompt']),
    researchData: getTextProperty(properties['Research Data']),
    brandAlignmentNotes: getTextProperty(properties['Brand Alignment Notes']),
    videoStatus: getSelectProperty(properties['Video Status']) as NotionPrompt['videoStatus'],
    targetPlatform: getMultiSelectProperty(properties['Target Platform']),
    caption: getTextProperty(properties['Caption']),
    hashtags: getTextProperty(properties['Hashtags']),
    scheduledDate: getDateProperty(properties['Scheduled Date']),
    videoUrl: getUrlProperty(properties['Video URL']),
    thumbnailUrl: getUrlProperty(properties['Thumbnail URL']),
    generationCost: getNumberProperty(properties['Generation Cost']),
    contentCategory: getSelectProperty(properties['Content Category']),
    promptVersion: getNumberProperty(properties['Prompt Version']) || 1,
  };
}

// Helper functions to extract Notion property values
function getTextProperty(property: any): string {
  if (!property) return '';

  if (property.title) {
    return property.title.map((t: any) => t.plain_text).join('');
  }

  if (property.rich_text) {
    return property.rich_text.map((t: any) => t.plain_text).join('');
  }

  return '';
}

function getSelectProperty(property: any): string {
  return property?.select?.name || '';
}

function getMultiSelectProperty(property: any): string[] {
  if (!property?.multi_select) return [];
  return property.multi_select.map((item: any) => item.name);
}

function getDateProperty(property: any): string {
  return property?.date?.start || '';
}

function getUrlProperty(property: any): string | undefined {
  return property?.url || undefined;
}

function getNumberProperty(property: any): number | undefined {
  return property?.number || undefined;
}

function getCheckboxProperty(property: any): boolean {
  return property?.checkbox || false;
}

// ========================================
// Story 2.3: Batch Workflow Integration
// ========================================

/**
 * Video Variation Record (Story 2.3, AC#2)
 * Tracks individual video variations through the generation pipeline
 */
export interface VideoVariationRecord {
  notionPageId?: string; // Set after creation
  batchId: string;
  combinationId: string;
  bigIdea: string;
  brand: string;
  aesthetic: string;
  type: string;
  demographic: string; // Combined age/gender/ethnicity
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  prompt: string;
  cost: number;
  videoUrl?: string;
  errorLogs?: string;
  soraVideoId?: string; // For polling Sora 2 API
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Batch Record
 * Tracks the overall batch submission
 */
export interface BatchRecord {
  batchId: string;
  brand: string;
  bigIdea: string;
  totalVariations: number;
  completedCount: number;
  failedCount: number;
  status: 'Initializing' | 'Generating' | 'Completed' | 'Failed';
  createdAt: Date;
}

// Environment variable for batch tracking database
const BATCH_DATABASE_ID = process.env.NOTION_BATCH_DATABASE_ID || DATABASE_ID;

/**
 * Creates Notion records for all video variations in a batch (Story 2.3, AC#1)
 */
export async function createBatchRecords(
  batchId: string,
  variations: Omit<VideoVariationRecord, 'notionPageId' | 'createdAt' | 'updatedAt' | 'batchId'>[]
): Promise<{ success: boolean; records: VideoVariationRecord[] }> {
  const records: VideoVariationRecord[] = [];

  try {
    console.log(`[Notion] Creating ${variations.length} records for batch ${batchId}`);

    for (const variation of variations) {
      try {
        const response = await notion.pages.create({
          parent: {
            database_id: BATCH_DATABASE_ID,
          },
          properties: {
            'Batch ID': {
              rich_text: [{ text: { content: batchId } }],
            },
            'Combination ID': {
              rich_text: [{ text: { content: variation.combinationId } }],
            },
            'Big Idea': {
              title: [{ text: { content: variation.bigIdea.substring(0, 200) } }], // Notion title limit
            },
            'Brand': {
              select: { name: variation.brand },
            },
            'Aesthetic': {
              select: { name: variation.aesthetic },
            },
            'Type': {
              select: { name: variation.type },
            },
            'Demographic': {
              rich_text: [{ text: { content: variation.demographic } }],
            },
            'Status': {
              select: { name: variation.status },
            },
            'Prompt': {
              rich_text: [{ text: { content: variation.prompt.substring(0, 2000) } }], // Notion limit
            },
            'Cost': {
              number: variation.cost,
            },
          },
        });

        const record: VideoVariationRecord = {
          ...variation,
          notionPageId: response.id,
          batchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        records.push(record);
      } catch (error) {
        console.error(`[Notion] Failed to create record for ${variation.combinationId}:`, error);
        // Continue with other records
      }
    }

    console.log(`[Notion] Successfully created ${records.length}/${variations.length} records`);

    return { success: records.length > 0, records };
  } catch (error) {
    console.error('[Notion] Batch record creation failed:', error);
    return { success: false, records: [] };
  }
}

/**
 * Updates video status in Notion (Story 2.3, AC#3 + Story 2.8, AC#5)
 * Enhanced with retry tracking for Story 2.8
 */
export async function updateVideoVariationStatus(
  notionPageId: string,
  status: VideoVariationRecord['status'],
  updates?: {
    videoUrl?: string;
    soraVideoId?: string;
    progress?: number;
    retryCount?: number; // Story 2.8, AC#5
    lastRetryAt?: string; // Story 2.8, AC#5
    modifiedPrompt?: string; // Story 2.8, AC#3
  }
): Promise<boolean> {
  try {
    const properties: any = {
      'Status': {
        select: { name: status },
      },
      'Updated At': {
        date: { start: new Date().toISOString() },
      },
    };

    if (updates?.videoUrl) {
      properties['Video URL'] = {
        url: updates.videoUrl,
      };
    }

    if (updates?.soraVideoId) {
      properties['Sora Video ID'] = {
        rich_text: [{ text: { content: updates.soraVideoId } }],
      };
    }

    if (updates?.progress !== undefined) {
      properties['Progress'] = {
        number: updates.progress,
      };
    }

    // Story 2.8, AC#5: Log retry attempts
    if (updates?.retryCount !== undefined) {
      properties['Retry Count'] = {
        number: updates.retryCount,
      };
    }

    if (updates?.lastRetryAt) {
      properties['Last Retry At'] = {
        date: { start: updates.lastRetryAt },
      };
    }

    if (updates?.modifiedPrompt) {
      properties['Modified Prompt'] = {
        rich_text: [{ text: { content: updates.modifiedPrompt.substring(0, 2000) } }],
      };
    }

    await notion.pages.update({
      page_id: notionPageId,
      properties,
    });

    console.log(`[Notion] Updated ${notionPageId} to status: ${status}${updates?.retryCount ? ` (retry #${updates.retryCount})` : ''}`);
    return true;
  } catch (error) {
    console.error(`[Notion] Failed to update status for ${notionPageId}:`, error);
    return false;
  }
}

/**
 * Logs error details for failed videos (Story 2.3, AC#4 + Story 2.8, AC#2)
 * Enhanced with error categorization for Story 2.8
 */
export async function logVideoError(
  notionPageId: string,
  errorType:
    | 'compliance_failed'
    | 'api_error'
    | 'generation_failed'
    | 'download_failed'
    | 'content_policy_violation' // Story 2.8, AC#1
    | 'missing_brand_data' // Story 2.8, AC#1
    | 'script_validation_failure', // Story 2.8, AC#1
  errorMessage: string,
  errorDetails?: Record<string, any>
): Promise<boolean> {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${errorType.toUpperCase()}: ${errorMessage}`;

    // Story 2.8, AC#2: Include full API response in error details
    const detailsJson = errorDetails ? `\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}` : '';

    const properties: any = {
      'Status': {
        select: { name: 'Failed' },
      },
      'Error Logs': {
        rich_text: [{ text: { content: (logEntry + detailsJson).substring(0, 2000) } }],
      },
      'Error Type': {
        select: { name: errorType },
      },
      'Updated At': {
        date: { start: timestamp },
      },
    };

    await notion.pages.update({
      page_id: notionPageId,
      properties,
    });

    console.log(`[Notion] Logged error for ${notionPageId}: ${errorType}`);
    return true;
  } catch (error) {
    console.error(`[Notion] Failed to log error for ${notionPageId}:`, error);
    return false;
  }
}

/**
 * Logs retry attempt in Notion (Story 2.8, AC#5)
 * Creates a detailed log of each retry attempt with attempt count and timestamp
 */
export async function logRetryAttempt(
  notionPageId: string,
  attemptNumber: number,
  previousError: string,
  modifiedPrompt?: string
): Promise<boolean> {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] RETRY ATTEMPT #${attemptNumber}\nPrevious Error: ${previousError}${modifiedPrompt ? `\nModified Prompt: ${modifiedPrompt}` : '\nUsing original prompt'}`;

    // Append to existing error logs
    const properties: any = {
      'Retry Count': {
        number: attemptNumber,
      },
      'Last Retry At': {
        date: { start: timestamp },
      },
      'Retry Logs': {
        rich_text: [{ text: { content: logEntry.substring(0, 2000) } }],
      },
      'Status': {
        select: { name: 'In Progress' }, // Set back to In Progress during retry
      },
      'Updated At': {
        date: { start: timestamp },
      },
    };

    if (modifiedPrompt) {
      properties['Modified Prompt'] = {
        rich_text: [{ text: { content: modifiedPrompt.substring(0, 2000) } }],
      };
    }

    await notion.pages.update({
      page_id: notionPageId,
      properties,
    });

    console.log(`[Notion] Logged retry attempt #${attemptNumber} for ${notionPageId}`);
    return true;
  } catch (error) {
    console.error(`[Notion] Failed to log retry attempt for ${notionPageId}:`, error);
    return false;
  }
}

/**
 * Fetches video variations by batch ID
 */
export async function getBatchVariations(batchId: string): Promise<VideoVariationRecord[]> {
  try {
    const response = await notion.databases.query({
      database_id: BATCH_DATABASE_ID,
      filter: {
        property: 'Batch ID',
        rich_text: {
          equals: batchId,
        },
      },
      sorts: [
        {
          property: 'Created At',
          direction: 'ascending',
        },
      ],
    });

    return response.results.map(parseVideoVariationPage);
  } catch (error) {
    console.error(`[Notion] Failed to fetch batch ${batchId}:`, error);
    return [];
  }
}

/**
 * Parses Notion page to VideoVariationRecord
 */
function parseVideoVariationPage(page: any): VideoVariationRecord {
  const properties = page.properties;

  return {
    notionPageId: page.id,
    batchId: getTextProperty(properties['Batch ID']),
    combinationId: getTextProperty(properties['Combination ID']),
    bigIdea: getTextProperty(properties['Big Idea']) || getTitleProperty(properties['Big Idea']),
    brand: getSelectProperty(properties['Brand']),
    aesthetic: getSelectProperty(properties['Aesthetic']),
    type: getSelectProperty(properties['Type']),
    demographic: getTextProperty(properties['Demographic']),
    status: getSelectProperty(properties['Status']) as VideoVariationRecord['status'],
    prompt: getTextProperty(properties['Prompt']),
    cost: getNumberProperty(properties['Cost']) || 0,
    videoUrl: getUrlProperty(properties['Video URL']),
    errorLogs: getTextProperty(properties['Error Logs']),
    soraVideoId: getTextProperty(properties['Sora Video ID']),
    createdAt: new Date(properties['Created At']?.created_time || Date.now()),
    updatedAt: new Date(properties['Updated At']?.last_edited_time || Date.now()),
  };
}

/**
 * Helper to get title property (different from rich_text)
 */
function getTitleProperty(property: any): string {
  if (!property?.title) return '';
  return property.title.map((t: any) => t.plain_text).join('');
}
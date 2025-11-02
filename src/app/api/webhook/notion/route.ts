// Webhook endpoint to receive prompts from Notion
import { NextRequest, NextResponse } from 'next/server';
import { updatePromptStatus } from '@/lib/notion-client';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Notion
    const notionToken = request.headers.get('X-Notion-Token');
    if (notionToken !== process.env.NOTION_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Extract prompt data from Notion webhook
    const promptData = {
      id: body.id,
      promptId: body.properties['Prompt ID']?.title?.[0]?.plain_text || '',
      prompt: body.properties['Final Sora Prompt']?.rich_text?.[0]?.plain_text || '',
      caption: body.properties['Caption']?.rich_text?.[0]?.plain_text || '',
      hashtags: body.properties['Hashtags']?.rich_text?.[0]?.plain_text || '',
      platform: body.properties['Target Platform']?.multi_select?.map((p: any) => p.name) || [],
      category: body.properties['Content Category']?.select?.name || 'General',
    };

    // Validate prompt data
    if (!promptData.prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }

    // Update status in Notion to "Generating"
    await updatePromptStatus(promptData.id, 'Generating');

    // Queue the video generation (this would trigger your existing video creation flow)
    const videoRequest = {
      model: 'sora-2' as const,
      prompt: promptData.prompt,
      size: '720x1280', // Portrait for social media
      seconds: 12,
      metadata: {
        notionId: promptData.id,
        promptId: promptData.promptId,
        caption: promptData.caption,
        hashtags: promptData.hashtags,
        platform: promptData.platform,
        category: promptData.category,
      },
    };

    // Store in queue or process immediately
    // This would integrate with your existing video generation logic
    console.log('📥 Received prompt from Notion:', promptData.promptId);
    console.log('🎬 Queuing video generation...');

    // You would call your existing video generation API here
    // For now, we'll return success
    return NextResponse.json({
      success: true,
      message: 'Prompt received and queued for generation',
      promptId: promptData.promptId,
      notionId: promptData.id,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhook/notion',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Notion-Token': 'your-notion-token',
    },
    body: {
      description: 'Notion database page object with properties',
    },
  });
}
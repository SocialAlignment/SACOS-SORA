// API endpoint to trigger AI pipeline for prompt generation
import { NextRequest, NextResponse } from 'next/server';
import { generateOptimizedPrompts } from '@/lib/ai-clients';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const count = body.count || 5;

    console.log(`🚀 Generating ${count} optimized prompts...`);

    // Run the AI pipeline
    const prompts = await generateOptimizedPrompts(count);

    // Format response with generated prompts
    const response = {
      success: true,
      count: prompts.length,
      prompts: prompts.map((p, index) => ({
        id: `SA-${new Date().toISOString().split('T')[0]}-${index + 1}`,
        prompt: p.prompt,
        caption: p.caption,
        hashtags: p.hashtags,
        category: p.category,
        estimatedCost: p.estimatedCost,
        status: 'Ready',
      })),
      totalEstimatedCost: prompts.reduce((sum, p) => sum + p.estimatedCost, 0),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI Pipeline error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate prompts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/status
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/ai-pipeline',
    description: 'Generate optimized Sora 2 prompts using AI pipeline',
    pipeline: 'Perplexity → Claude → Gemini',
    apis: {
      perplexity: !!process.env.PERPLEXITY_API_KEY,
      claude: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GOOGLE_GEMINI_API_KEY,
    },
    usage: {
      method: 'POST',
      body: {
        count: 'number (1-10) - Number of prompts to generate',
      },
    },
  });
}
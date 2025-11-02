// Simple test endpoint to verify the pipeline works
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // Return a ready-to-use Sora 2 prompt for Social Alignment
  const testPrompt = {
    success: true,
    message: 'Test prompt ready for Sora 2',
    prompt: {
      id: `SA-${new Date().toISOString().split('T')[0]}-TEST`,
      finalSoraPrompt: `[Style: Cinematic 4K, modern tech aesthetic, purple and blue color palette]
[Scene: Futuristic office space with floating holographic displays showing data visualizations]
[Action: 0-3s: Wide establishing shot of empty modern workspace, 3-6s: Holographic AI interface materializes with purple glow, 6-9s: Data streams and charts animate showing exponential growth, 9-12s: Social Alignment logo forms from data particles with tagline "Aligning AI with Business Growth"]
[Camera: Smooth dolly forward, shallow depth of field, slight upward tilt]
[Lighting: Cool blue ambient with purple accent lights, soft volumetric haze, dramatic rim lighting]
[Brand: Social Alignment purple (#8B5CF6) prominently featured, clean minimal aesthetic]`,
      caption: `🚀 Watch how AI transforms business growth in just 12 seconds! Social Alignment brings you the future of digital transformation. Are you ready to align your business with AI-powered success?`,
      hashtags: '#SocialAlignment #AITransformation #DigitalGrowth #Sora2 #BusinessInnovation #TechTrends2025 #AIProductivity #FutureOfWork #B2BTech #AutomatedSuccess',
      category: 'Brand Story',
      platform: ['TikTok', 'Instagram', 'LinkedIn'],
      estimatedCost: 2.40,
      status: 'Ready',
    },
    usage: {
      model: 'sora-2',
      size: '720x1280',
      seconds: 12,
      description: 'Vertical format optimized for social media',
    },
    notionTemplate: {
      promptId: 'SA-TEST-001',
      videoStatus: 'Ready',
      webhookTrigger: true,
      scheduledDate: new Date().toISOString().split('T')[0],
    },
  };

  return NextResponse.json(testPrompt);
}

export async function POST(request: NextRequest) {
  // Generate a custom prompt based on input
  const body = await request.json();
  const { topic = 'AI innovation', platform = 'TikTok' } = body;

  const customPrompt = {
    success: true,
    prompt: {
      id: `SA-${Date.now()}`,
      finalSoraPrompt: `[Style: Cinematic 4K, modern minimalist, Social Alignment brand colors]
[Scene: Abstract digital environment representing ${topic}]
[Action: 0-3s: Opening with particles forming, 3-6s: Main concept visualization, 6-9s: Transformation sequence, 9-12s: Social Alignment brand reveal]
[Camera: Dynamic movement appropriate for ${platform}]
[Lighting: Purple and blue gradient, professional and engaging]
[Brand: Social Alignment identity integrated throughout]`,
      caption: `✨ Discover how ${topic} is reshaping the future! Social Alignment brings you cutting-edge insights.`,
      hashtags: `#SocialAlignment #${topic.replace(/\s+/g, '')} #${platform} #Innovation #Sora2`,
      category: 'Educational',
      estimatedCost: 2.40,
    },
  };

  return NextResponse.json(customPrompt);
}
// Brand-aware prompt generation using Social Alignment brand guidelines
import { NextRequest, NextResponse } from 'next/server';
import { SOCIAL_ALIGNMENT_BRAND, getBrandContext, getAvatarContext, getPlatformContext } from '@/lib/brand-config';

export async function GET(request: NextRequest) {
  // Get query parameters
  const { searchParams } = new URL(request.url);
  const avatarIndex = parseInt(searchParams.get('avatar') || '0');
  const platform = searchParams.get('platform') || 'TikTok';
  const pillarIndex = parseInt(searchParams.get('pillar') || '0');

  // Select content based on brand pillars
  const contentPillar = SOCIAL_ALIGNMENT_BRAND.contentPillars[pillarIndex];
  const targetAvatar = SOCIAL_ALIGNMENT_BRAND.targetAvatars[avatarIndex];
  const topic = contentPillar.topics[Math.floor(Math.random() * contentPillar.topics.length)];

  // Generate hook based on avatar pain points
  const painPoint = targetAvatar.painPoints[Math.floor(Math.random() * targetAvatar.painPoints.length)];
  const hook = `What if you could solve "${painPoint}" instantly?`; // ✅ REAL API: Removed fake 12-second timing

  // Create brand-aligned Sora 2 prompt
  // ✅ REAL API: Using 10-second timing (valid durations: 5, 10, 20 seconds)
  const soraPrompt = `[Style: Cinematic 4K, modern minimalist tech aesthetic, Social Alignment brand colors]
[Scene: Futuristic workspace transitioning from chaos to perfect alignment, purple (#8B5CF6) and cyan (#06B6D4) color palette]

[Action - 10 seconds:
0-2.5s: Open on cluttered data streams and disconnected systems in grayscale
2.5-5s: Purple light beam cuts through, organizing data into flowing patterns
5-7.5s: Systems align into perfect harmony, forming growth charts trending upward
7.5-10s: Social Alignment logo emerges from aligned data particles with tagline "Align. Transform. Grow."]

[Camera: Smooth dolly forward with subtle rotation, shallow depth of field focusing on transformation]
[Lighting: Dark to light transition, volumetric purple/cyan lighting, soft glow on key elements]
[Brand: Social Alignment colors prominent, clean geometric shapes, professional yet innovative]`;

  // Generate platform-optimized caption
  const captions = {
    TikTok: `🚀 ${hook} Watch this transformation! The future of ${topic.toLowerCase()} is here, and it's mind-blowing. ${SOCIAL_ALIGNMENT_BRAND.toneOfVoice.signaturePhrases[0]} 💜`,
    Instagram: `✨ ${targetAvatar.name}, this is for you.\n\n${hook}\n\nSwipe to see how we're transforming ${topic.toLowerCase()} for businesses like yours.\n\n${SOCIAL_ALIGNMENT_BRAND.toneOfVoice.signaturePhrases[1]} 🎯`,
    LinkedIn: `${hook}\n\nAs ${targetAvatar.description}, you understand the challenge of ${painPoint}.\n\nHere's how leading companies are leveraging AI to transform ${topic.toLowerCase()}.\n\n${SOCIAL_ALIGNMENT_BRAND.toneOfVoice.signaturePhrases[2]}`,
  };

  // Generate hashtags based on platform and avatar
  const hashtags = {
    TikTok: '#SocialAlignment #AITransformation #B2BTech #TechTok #BusinessGrowth #DigitalStrategy #Innovation2025 #AutomationNation #GrowthHack #FYP',
    Instagram: '#SocialAlignment #AIInnovation #DigitalTransformation #BusinessStrategy #TechLeadership #ModernBusiness #GrowthMindset #FutureOfWork #EntrepreneurLife #InnovateOrDie',
    LinkedIn: '#ThoughtLeadership #DigitalTransformation #EnterpriseAI #BusinessInnovation #B2B #StrategicGrowth #LeadershipDevelopment #ChangeManagement #FutureReady #SocialAlignment',
  };

  const response = {
    success: true,
    brand: 'Social Alignment',
    prompt: {
      id: `SA-${new Date().toISOString().split('T')[0]}-${pillarIndex}-${avatarIndex}`,
      finalSoraPrompt: soraPrompt,
      caption: captions[platform as keyof typeof captions] || captions.TikTok,
      hashtags: hashtags[platform as keyof typeof hashtags] || hashtags.TikTok,

      metadata: {
        contentPillar: contentPillar.pillar,
        topic: topic,
        targetAvatar: targetAvatar.name,
        platform: platform,
        painPoint: painPoint,
        angle: contentPillar.angle,
        hook: hook,
        emotionalTone: SOCIAL_ALIGNMENT_BRAND.toneOfVoice.characteristics.emotion.primary,
        visualStyle: SOCIAL_ALIGNMENT_BRAND.visual.videoStyle.preferred[0],
      },

      brandElements: {
        colors: SOCIAL_ALIGNMENT_BRAND.visual.colors,
        voice: SOCIAL_ALIGNMENT_BRAND.toneOfVoice.primary,
        values: SOCIAL_ALIGNMENT_BRAND.identity.values[0],
        signaturePhrase: SOCIAL_ALIGNMENT_BRAND.toneOfVoice.signaturePhrases[Math.floor(Math.random() * SOCIAL_ALIGNMENT_BRAND.toneOfVoice.signaturePhrases.length)],
      },

      estimatedCost: 2.40,
      status: 'Ready',
    },

    usage: {
      endpoint: '/api/brand-prompt',
      parameters: {
        avatar: `0-${SOCIAL_ALIGNMENT_BRAND.targetAvatars.length - 1} (current: ${avatarIndex})`,
        platform: `TikTok|Instagram|LinkedIn|YouTube (current: ${platform})`,
        pillar: `0-${SOCIAL_ALIGNMENT_BRAND.contentPillars.length - 1} (current: ${pillarIndex})`,
      },
      example: '/api/brand-prompt?avatar=0&platform=TikTok&pillar=1',
    },

    availableOptions: {
      avatars: SOCIAL_ALIGNMENT_BRAND.targetAvatars.map((a, i) => ({ index: i, name: a.name })),
      pillars: SOCIAL_ALIGNMENT_BRAND.contentPillars.map((p, i) => ({ index: i, name: p.pillar })),
      platforms: Object.keys(SOCIAL_ALIGNMENT_BRAND.platformStrategy),
    },
  };

  return NextResponse.json(response);
}

// POST endpoint for custom topic with brand alignment
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    topic = 'AI automation',
    avatar = 0,
    platform = 'TikTok',
    urgency = 'medium'
  } = body;

  const targetAvatar = SOCIAL_ALIGNMENT_BRAND.targetAvatars[avatar];
  const brandVoice = SOCIAL_ALIGNMENT_BRAND.toneOfVoice;

  // Create urgency-based hook
  const hooks = {
    high: `⚡ BREAKING: The ${topic} revolution is happening NOW. Don't get left behind!`,
    medium: `🎯 ${targetAvatar.name}: Here's why ${topic} is your next competitive advantage`,
    low: `💡 Curious how ${topic} could transform your business? Let's explore...`
  };

  // ✅ REAL API: Using 10-second timing (valid durations: 5, 10, 20 seconds)
  const soraPrompt = `[Style: ${SOCIAL_ALIGNMENT_BRAND.visual.videoStyle.preferred.join(', ')}]
[Scene: Abstract visualization of ${topic} concept using Social Alignment brand colors]

[Action - 10 seconds:
0-2.5s: Problem visualization - chaos/inefficiency in muted tones
2.5-5s: Social Alignment solution enters - purple light organizing elements
5-7.5s: Transformation sequence - systems aligning, metrics improving
7.5-10s: Success state with brand reveal - "Social Alignment: ${brandVoice.signaturePhrases[0]}"]

[Camera: Dynamic movement suited for ${platform}]
[Lighting: ${SOCIAL_ALIGNMENT_BRAND.visual.colors.gradient} lighting scheme]
[Brand: Purple (#8B5CF6) and Cyan (#06B6D4) prominently featured throughout]`;

  const response = {
    success: true,
    prompt: {
      id: `SA-CUSTOM-${Date.now()}`,
      finalSoraPrompt: soraPrompt,
      caption: `${hooks[urgency as keyof typeof hooks]} ${brandVoice.contentFormulas.value}`,
      hashtags: SOCIAL_ALIGNMENT_BRAND.platformStrategy[platform as keyof typeof SOCIAL_ALIGNMENT_BRAND.platformStrategy]?.hashtags.join(' ') || '#SocialAlignment',
      targetAvatar: targetAvatar.name,
      platform: platform,
      topic: topic,
      estimatedCost: 5.00, // ✅ REAL API: $5.00 for sora-2 at 10 seconds
    },
  };

  return NextResponse.json(response);
}
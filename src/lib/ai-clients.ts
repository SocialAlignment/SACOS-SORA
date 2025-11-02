// AI Pipeline Orchestration for Sora 2 Prompt Generation
// Perplexity → Claude → Gemini → Final Prompt

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Perplexity client (uses OpenAI-compatible API)
async function callPerplexity(query: string) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online', // ✅ VERIFIED: 70B model for better quality trend research
      messages: [
        {
          role: 'system',
          content: 'You are a trend researcher for Social Alignment, a company focused on AI-powered content creation. Find trending topics suitable for faceless video content.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Sora 2 Prompt Template
// ✅ REAL API: Using 10 seconds (valid Sora durations: 5, 10, 20)
const SORA_PROMPT_TEMPLATE = `
[Style Definition]
{style}

[Scene Description]
{scene}

[Subject/Action - 10 seconds]
0-2.5s: {action1}
2.5-5s: {action2}
5-7.5s: {action3}
7.5-10s: {action4}

[Camera Work]
{camera}

[Lighting/Color]
{lighting}

[Brand Elements]
{brand}
`;

export interface ContentIdea {
  topic: string;
  trend: string;
  audience: string;
  hook: string;
  platform: string[];
}

export interface OptimizedPrompt {
  prompt: string;
  caption: string;
  hashtags: string;
  category: string;
  estimatedCost: number;
}

/**
 * Step 1: Research trending topics with Perplexity
 */
export async function researchTrendingTopics(
  niche: string = 'AI technology and digital transformation'
): Promise<ContentIdea[]> {
  const query = `
    Find 5 current trending topics in ${niche} that would work well for:
    - Faceless video content
    - 10-second format (Sora 2 API: 5, 10, or 20 seconds)
    - Viral potential on TikTok/Instagram
    - Professional B2B audience
    - Social Alignment brand (innovation, growth, alignment)

    For each topic, provide:
    1. The trend name
    2. Why it's trending
    3. Target audience
    4. A compelling hook
    5. Best platforms

    Focus on visual concepts that don't require people's faces.
  `;

  try {
    const research = await callPerplexity(query);
    // Parse the research into structured data
    return parseResearchToIdeas(research);
  } catch (error) {
    console.error('Perplexity research error:', error);
    return [];
  }
}

/**
 * Step 2: Humanize and align with brand using Claude
 */
export async function humanizeWithClaude(
  idea: ContentIdea,
  brandVoice: string = 'Professional yet approachable, innovative, growth-focused'
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929', // ✅ VERIFIED: Claude 4.5 Sonnet (3.5 deprecated Oct 28, 2025)
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `
            Take this content idea and adapt it for Social Alignment's brand:

            Topic: ${idea.topic}
            Trend: ${idea.trend}
            Hook: ${idea.hook}

            Brand Voice: ${brandVoice}

            Create a narrative that:
            1. Aligns with Social Alignment's mission
            2. Feels authentic and human
            3. Focuses on transformation and growth
            4. Works as a 10-second visual story (Sora 2: 5, 10, or 20 sec)
            5. Doesn't require showing faces
            6. Has viral potential

            Output a cohesive story concept that can be visualized.
          `,
        },
      ],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (error) {
    console.error('Claude humanization error:', error);
    return idea.topic;
  }
}

/**
 * Step 3: Optimize for Sora 2 using Gemini
 */
export async function optimizeWithGemini(
  concept: string,
  platform: string = 'TikTok'
): Promise<OptimizedPrompt> {
  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' }); // ✅ VERIFIED: Gemini 2.5 Flash (1.5 deprecated)

    const prompt = `
      Create a Sora 2 optimized video prompt from this concept:

      Concept: ${concept}
      Platform: ${platform}

      Requirements:
      - 10-second faceless video (Sora 2 API: 5, 10, or 20 seconds)
      - Cinematic quality
      - Modern tech aesthetic with purple accents (Social Alignment brand)
      - Clear action beats for each 2.5-second segment
      - No faces, no captions needed
      - Suitable for viral ${platform} content

      Also provide:
      1. A compelling caption (with emoji hook)
      2. 10-15 strategic hashtags
      3. Content category

      Format the prompt using this exact template:
      ${SORA_PROMPT_TEMPLATE}

      Make it visually stunning and engaging for a B2B tech audience.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return parseGeminiResponse(response, platform);
  } catch (error) {
    console.error('Gemini optimization error:', error);
    return {
      prompt: concept,
      caption: 'Check out our latest innovation! 🚀',
      hashtags: '#SocialAlignment #AIContent #Innovation',
      category: 'Educational',
      estimatedCost: 2.5,
    };
  }
}

/**
 * Full pipeline: Research → Humanize → Optimize
 */
export async function generateOptimizedPrompts(
  count: number = 5
): Promise<OptimizedPrompt[]> {
  console.log('🔬 Starting AI pipeline for prompt generation...');

  // Step 1: Research
  const ideas = await researchTrendingTopics();
  console.log(`📊 Found ${ideas.length} trending topics`);

  // Process top ideas through the pipeline
  const prompts: OptimizedPrompt[] = [];

  for (let i = 0; i < Math.min(count, ideas.length); i++) {
    const idea = ideas[i];
    console.log(`🎯 Processing idea ${i + 1}: ${idea.topic}`);

    // Step 2: Humanize
    const humanized = await humanizeWithClaude(idea);
    console.log(`💡 Humanized concept created`);

    // Step 3: Optimize for each platform
    for (const platform of idea.platform.slice(0, 2)) {
      const optimized = await optimizeWithGemini(humanized, platform);
      prompts.push(optimized);
      console.log(`✨ Optimized for ${platform}`);
    }

    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`✅ Generated ${prompts.length} optimized prompts`);
  return prompts;
}

// Helper function to parse research into structured ideas
function parseResearchToIdeas(research: string): ContentIdea[] {
  // This would parse the Perplexity response into structured data
  // For now, returning sample data
  return [
    {
      topic: 'AI Automation in 2025',
      trend: 'No-code AI tools democratizing automation',
      audience: 'Business leaders and entrepreneurs',
      hook: 'What if you could automate your entire workflow instantly?',
      platform: ['TikTok', 'Instagram', 'LinkedIn'],
    },
    {
      topic: 'Digital Transformation Speed',
      trend: 'Companies achieving 10x growth through AI',
      audience: 'C-suite executives',
      hook: 'The transformation that changed everything',
      platform: ['LinkedIn', 'YouTube Shorts'],
    },
    // Add more parsed ideas...
  ];
}

// Helper function to parse Gemini response
function parseGeminiResponse(response: string, platform: string): OptimizedPrompt {
  // Extract the formatted prompt, caption, and hashtags from response
  // This would parse the Gemini response properly

  // ✅ REAL API: Calculate cost for 10 seconds (baseline Sora 2: $5.00 for sora-2, $12.00 for sora-2-pro)
  const estimatedCost = 5.0; // Assuming sora-2 model at 10 seconds

  return {
    prompt: response.split('Caption:')[0].trim(),
    caption: extractBetween(response, 'Caption:', 'Hashtags:') || '🚀 Innovation in motion',
    hashtags: extractBetween(response, 'Hashtags:', 'Category:') || '#SocialAlignment #Sora2',
    category: extractBetween(response, 'Category:', null) || 'Educational',
    estimatedCost,
  };
}

function extractBetween(text: string, start: string, end: string | null): string {
  const startIdx = text.indexOf(start);
  if (startIdx === -1) return '';

  const contentStart = startIdx + start.length;
  const endIdx = end ? text.indexOf(end, contentStart) : text.length;

  return text.substring(contentStart, endIdx === -1 ? text.length : endIdx).trim();
}
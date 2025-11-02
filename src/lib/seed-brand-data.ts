// Seed Brand Data Script (Story 1.2)
// Loads Social Alignment and Demo Brand into QDRANT

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { OpenAI } from 'openai';
import type { BrandCanon } from '@/types/brand-canon';
import {
  upsertBrandCanon,
  getDemoBrand,
  checkQdrantHealth,
} from '@/lib/qdrant-client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate embedding vector from brand text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Social Alignment brand canon (extracted from existing build patterns)
 */
const SOCIAL_ALIGNMENT_BRAND: BrandCanon = {
  brand_id: 'social-alignment',
  brand_name: 'Social Alignment',
  voice:
    'Professional yet innovative, forward-thinking, empowering. Primary tone: Visionary Empowerment - inspiring leaders to transform their businesses through AI and alignment. Characteristics: Bold but not aggressive, confident but not arrogant, technical but accessible. Signature phrases include "Align. Transform. Grow.", "The future of [topic] is here", and value-driven messaging focused on transformation and competitive advantage.',
  visual_style:
    'Cinematic 4K modern minimalist tech aesthetic with purple (#8B5CF6) and cyan (#06B6D4) brand colors. Preferred video styles: futuristic workspace scenes, abstract data visualization, transformation sequences (chaos to harmony), clean geometric shapes. Lighting: dark to light transitions, volumetric purple/cyan lighting, soft glows. Camera: smooth dolly movements with subtle rotation, shallow depth of field.',
  icp_profile:
    'B2B business owners, CTOs, and digital transformation leaders ages 35-55 in mid-market to enterprise companies. Target avatars include tech-forward executives facing challenges with disconnected systems, data alignment, business scaling, and AI adoption. Pain points: inefficient processes, missed growth opportunities, inability to leverage data effectively, competitive pressure to innovate.',
  successful_prompts: [
    '[Style: Cinematic 4K, modern minimalist tech aesthetic] [Scene: Futuristic workspace transitioning from chaos to perfect alignment, purple and cyan color palette] [Action: 0-2.5s chaos, 2.5-5s purple light organizing data, 5-7.5s harmony and growth, 7.5-10s brand reveal]', // ✅ REAL API: Using 10 seconds (valid durations: 5, 10, 20)
    '[Style: Abstract data visualization with Social Alignment brand colors] [Scene: Problem visualization in muted tones transforming to solution state] [Action: Systems aligning, metrics improving, success with brand tagline]',
    'Transformation sequences showing disorder becoming order through alignment, always featuring purple/cyan lighting and geometric patterns',
  ],
  prohibited_content: [
    'No copyrighted content or brand logos of other companies',
    'No real people or recognizable individuals',
    'No explicit text or on-screen graphics (brand name in final frame only)',
    'No captions or subtitles in video',
    'Max 45 spoken words if voiceover included',
    'Max 65 syllables total',
    'Avoid generic stock footage aesthetics - must feel premium and innovative',
    'No competitor brand colors or visual styles',
  ],
};

/**
 * Seed brands into QDRANT
 */
async function seedBrands() {
  console.log('🌱 Starting brand data seeding...\n');

  // Check QDRANT health
  const isHealthy = await checkQdrantHealth();
  if (!isHealthy) {
    console.error('❌ QDRANT health check failed. Is the service running?');
    process.exit(1);
  }
  console.log('✅ QDRANT connection healthy\n');

  // Seed Social Alignment brand
  console.log('📦 Seeding Social Alignment brand...');
  const socialAlignmentText = `${SOCIAL_ALIGNMENT_BRAND.brand_name} ${SOCIAL_ALIGNMENT_BRAND.voice} ${SOCIAL_ALIGNMENT_BRAND.visual_style} ${SOCIAL_ALIGNMENT_BRAND.icp_profile}`;
  const socialAlignmentVector = await generateEmbedding(socialAlignmentText);

  const socialAlignmentSuccess = await upsertBrandCanon(
    SOCIAL_ALIGNMENT_BRAND,
    socialAlignmentVector
  );

  if (socialAlignmentSuccess) {
    console.log('✅ Social Alignment brand loaded successfully');
  } else {
    console.error('❌ Failed to load Social Alignment brand');
  }

  // Seed Demo Brand
  console.log('\n📦 Seeding Demo Brand...');
  const demoBrand = getDemoBrand();
  const demoBrandText = `${demoBrand.brand_name} ${demoBrand.voice} ${demoBrand.visual_style} ${demoBrand.icp_profile}`;
  const demoBrandVector = await generateEmbedding(demoBrandText);

  const demoBrandSuccess = await upsertBrandCanon(demoBrand, demoBrandVector);

  if (demoBrandSuccess) {
    console.log('✅ Demo Brand loaded successfully');
  } else {
    console.error('❌ Failed to load Demo Brand');
  }

  console.log('\n🎉 Brand seeding complete!');
  console.log('\nSeeded brands:');
  console.log('  1. Social Alignment (brand_id: social-alignment)');
  console.log('  2. Demo Brand (brand_id: demo-brand)');
}

// Run if executed directly
if (require.main === module) {
  seedBrands()
    .then(() => {
      console.log('\n✨ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedBrands, SOCIAL_ALIGNMENT_BRAND };

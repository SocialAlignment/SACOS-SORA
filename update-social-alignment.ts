// Update Social Alignment brand with CORRECT information
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

import { OpenAI } from 'openai';
import { upsertBrandCanon } from './src/lib/qdrant-client';
import type { BrandCanon } from './src/types/brand-canon';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CORRECTED_SOCIAL_ALIGNMENT: BrandCanon = {
  brand_id: 'social-alignment',
  brand_name: 'Social Alignment',

  voice: `Professional, innovative, human-first. Primary tone: Human-Centered AI Empowerment - helping leaders leverage AI to amplify human brilliance, not replace it. Characteristics: Optimistic yet pragmatic, nostalgic yet forward-thinking, accessible but sophisticated. Signature phrases include "Alignment Before Automation", "AI is a tool that can be used to amplify your human brilliance, not replace it", and messaging focused on human-AI collaboration and thoughtful technology adoption.`,

  visual_style: `Retro-Futuristic Mid-Century Modern Aesthetic. Color Palette: Warm earth tones (burnt orange, rust, terracotta), cool accents (teal, sage green, muted turquoise), neutrals (cream, beige, warm gray, coffee brown) - overall muted, desaturated vintage scheme. Preferred video styles: 1950s-style educational/instructional sequences, vintage data visualization (analog dials, punch cards, retro screens), transformation sequences (analog chaos → digital harmony), geometric space-age patterns, human-AI collaboration with friendly retro robots. Visual elements: Flat vector-style with subtle grain texture, simplified geometric character designs, vintage tech imagery (circuit boards, gears, control panels), space age motifs (planets, stars, atomic patterns), clean line work, balanced symmetrical compositions. Lighting: Warm-to-cool transitions (rust/orange → teal/sage), soft vintage glow, nostalgic film grain. Camera: Smooth deliberate dolly movements (educational film style), gentle pans, minimal depth with flat perspective, occasional slow zoom for emphasis. Mood: Optimistic technological nostalgia - approachable, professional, human-first.`,

  icp_profile: `[NEEDS UPDATE - Please provide correct ICP profile]`,

  successful_prompts: [
    '[Style: Retro-futuristic mid-century modern with warm earth tones and vintage aesthetic] [Scene: 1950s-style educational sequence showing analog chaos transforming to digital harmony, muted orange/teal palette] [Action: 0-3s vintage tech overwhelm, 3-6s friendly retro robot introducing order, 6-9s human-AI collaboration success, 9-12s Social Alignment brand reveal with space-age motif]',
    '[Style: Flat vector illustration with grain texture, mid-century color scheme] [Scene: Vintage data visualization with analog dials and punch cards modernizing, warm rust/sage green tones] [Action: Geometric transformation showing alignment before automation principle]',
    'Human-first AI collaboration sequences with nostalgic 1950s educational film aesthetic, featuring friendly retro robots, space-age patterns, and warm vintage color palette throughout'
  ],

  prohibited_content: [
    'No copyrighted content or brand logos of other companies',
    'No real people or recognizable individuals',
    'No explicit text or on-screen graphics (brand name in final frame only)',
    'No captions or subtitles in video',
    'Max 45 spoken words if voiceover included',
    'Max 65 syllables total',
    'Avoid generic modern minimalist aesthetics - must have retro-futuristic mid-century character',
    'No cold/sterile tech aesthetics - maintain warm, human-first, nostalgic feel',
    'No purple/cyan modern color schemes - use warm earth tones and vintage palette'
  ],
};

async function updateSocialAlignment() {
  console.log('🔄 Updating Social Alignment brand with CORRECT information...\n');

  // Generate embedding
  const brandText = `${CORRECTED_SOCIAL_ALIGNMENT.brand_name} ${CORRECTED_SOCIAL_ALIGNMENT.voice} ${CORRECTED_SOCIAL_ALIGNMENT.visual_style} ${CORRECTED_SOCIAL_ALIGNMENT.icp_profile}`;

  console.log('🧠 Generating new embedding vector...');
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: brandText,
  });

  const vector = embedding.data[0].embedding;

  // Upload to QDRANT
  console.log('📤 Uploading corrected brand to QDRANT...');
  const result = await upsertBrandCanon(CORRECTED_SOCIAL_ALIGNMENT, vector);

  if (result.success) {
    console.log('✅ Social Alignment brand UPDATED successfully!\n');
    console.log('📊 Updated Information:');
    console.log('━'.repeat(80));
    console.log('\n🎤 CORRECTED VOICE:');
    console.log(CORRECTED_SOCIAL_ALIGNMENT.voice);
    console.log('\n🎨 CORRECTED VISUAL STYLE:');
    console.log(CORRECTED_SOCIAL_ALIGNMENT.visual_style.substring(0, 200) + '...');
    console.log('\n✅ Signature phrases now include:');
    console.log('  - "Alignment Before Automation"');
    console.log('  - "AI is a tool that can be used to amplify your human brilliance, not replace it"');
    console.log('\n🎨 Visual aesthetic: Retro-Futuristic Mid-Century Modern');
    console.log('  Colors: Warm earth tones (rust, orange, terracotta) + cool accents (teal, sage)');
    console.log('\n⚠️  NOTE: ICP profile needs to be updated with correct information');
  } else {
    console.error('❌ Failed to update:', result.error);
  }
}

updateSocialAlignment()
  .then(() => {
    console.log('\n✨ Update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });

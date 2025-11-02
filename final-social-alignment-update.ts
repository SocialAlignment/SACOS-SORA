// FINAL CORRECT Social Alignment Brand Update
// Based on complete offer document and clarifications
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

import { OpenAI } from 'openai';
import { upsertBrandCanon } from './src/lib/qdrant-client';
import type { BrandCanon } from './src/types/brand-canon';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FINAL_SOCIAL_ALIGNMENT: BrandCanon = {
  brand_id: 'social-alignment',
  brand_name: 'Social Alignment',

  voice: `Professional, innovative, human-first. Primary tone: Human-Centered AI Empowerment - helping leaders leverage AI to amplify human brilliance, not replace it.

Core Philosophy: "Alignment Before Automation" - ensuring human vision and values drive AI adoption, not the other way around.

Characteristics: Optimistic yet pragmatic, nostalgic yet forward-thinking, accessible but sophisticated, bold but not aggressive, confident but not arrogant, technical but accessible.

Signature Phrases:
- "Alignment Before Automation"
- "AI is a tool that can be used to amplify your human brilliance, not replace it"
- "Amplify. Learn. Integrate. Generate. Navigate." (A.L.I.G.N.™ Protocol)
- "Where human brilliance meets cutting-edge AI systems"
- "Stop guessing, stop grinding, start scaling"

Messaging Focus: Human-AI collaboration, thoughtful technology adoption, brand authority, automation without losing the human touch, transformation through alignment, future-proof operations, reclaiming time for strategic growth.

Value Proposition: We don't just throw AI at your business - we amplify your unique brilliance, teach AI to think like you, integrate seamlessly, generate consistently, and navigate your long-term optimization.`,

  visual_style: `Retro-Futuristic Mid-Century Modern Aesthetic - Optimistic Technological Nostalgia

Color Palette:
- Warm Earth Tones: Burnt orange (#D2691E), rust (#B7410E), terracotta (#E2725B)
- Cool Accents: Teal (#008080), sage green (#9DC183), muted turquoise (#40E0D0)
- Neutrals: Cream (#FFFDD0), beige (#F5F5DC), warm gray (#D3D3D3), coffee brown (#6F4E37)
- Overall: Muted, desaturated vintage color scheme with warm-to-cool transitions

Preferred Video Styles:
- 1950s-style educational/instructional sequences
- Vintage data visualization (analog dials, punch cards, retro screens, control panels)
- Transformation sequences: analog chaos → digital harmony
- Geometric space-age patterns and orbital motions
- Human-AI collaboration scenes with friendly retro robots
- Mid-century modern office/workspace settings

Visual Elements:
- Flat, vector-style illustration with subtle grain texture
- Simplified geometric character designs
- Vintage tech imagery: circuit boards, gears, control panels, transistors
- Space age motifs: planets, stars, atomic patterns, satellite orbits
- Clean line work with limited shading
- Balanced, symmetrical compositions
- Retro typography and signage

Lighting & Atmosphere:
- Warm-to-cool color transitions (rust/orange → teal/sage)
- Soft vintage glow effects
- Nostalgic film grain or texture overlay
- Dark to light transitions maintaining vintage palette
- Subtle halation on highlights (vintage film effect)

Camera Movement:
- Smooth, deliberate dolly movements (educational film style)
- Gentle pans across illustrated scenes
- Minimal depth with flat perspective (mid-century graphic style)
- Occasional slow zoom for emphasis
- Steady, professional framing throughout

Mood & Tone: Optimistic technological nostalgia - approachable, professional, human-first, warm, inviting, trustworthy. The aesthetic should evoke the hopeful, forward-thinking spirit of 1950s-60s technology optimism while feeling modern and relevant.

AVOID: Modern minimalist aesthetics, cold/sterile tech looks, purple/cyan color schemes, harsh lighting, chaotic compositions, generic stock footage, contemporary "tech startup" visuals.`,

  icp_profile: `Social Alignment serves 4 distinct target personas (dynamically targetable based on content calendar and campaign strategy):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💼 PERSONA 1: ETHAN BROOKS - The Scalable Solo Founder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Profile: Modern solopreneur running boutique marketing agency. Stellar reputation, steady referrals, but drowning in manual processes.

Demographics:
- Age: 32-42
- Role: Solo founder/boutique agency owner
- Company: 1-5 person operation
- Revenue: $100K-$500K/year

Pain Points:
- Investing 30+ hours/week on manual proposals, content creation, system management
- Stuck between ambition and burnout
- Reactive, not strategic
- Terrified competitors using automation will outpace him
- Grinding late nights in Canva and Notion
- Slow follow-ups and ad hoc systems

Desired Outcomes:
- Save 10-15+ hours per week
- Transform from scrappy hustle to scalable machine
- Reclaim time for strategic growth
- Increase capacity without hiring
- Establish AI-driven backend
- Launch predictable content and campaigns

Decision Factors: Requires automation AND clarity. Needs roadmap, not just tools. High-integrity, high-potential operator ready to lead, not lag.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏋️ PERSONA 2: BOB THOMPSON - The High-Achieving Gym Owner
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Profile: Sharp, ROI-obsessed gym owner with thriving boutique fitness brand but leaving money and momentum on table.

Demographics:
- Age: 35-50
- Role: Gym owner/fitness entrepreneur
- Business: Boutique fitness studio
- Revenue: $200K-$1M/year

Pain Points:
- Content lags behind elite results delivered to clients
- Ad systems leak, backend operations duct-taped
- Brand presence not as powerful as transformations
- Rising ad costs, low lead conversion
- Ineffective follow-up systems
- Manual client onboarding

Desired Outcomes:
- Brand presence as powerful as client transformations
- Cinematic video that stops the scroll
- Automation that converts leads without chasing
- Enhanced lead flow
- Elevated brand positioning
- Premium pricing and positioning

Decision Factors: Seeks brand elevation. Craves Super Bowl-level content. Needs automation without losing personal touch. Ready to shift from local leader to regional authority.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👩‍💼 PERSONA 3: SYLVIA/MELISSA THOMPSON - The Accountant/Financial Strategist
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Profile: Powerhouse fractional CFO/accountant with premium reputation-driven firm feeling weight of manual tasks and rising competition.

Demographics:
- Age: 40-60
- Role: Fractional CFO, CPA, Financial Advisor
- Business: Advisory/consulting firm
- Revenue: $250K-$2M/year

Pain Points:
- Growing weight of manual tasks
- Rising client demands
- Creeping competition
- Brilliance lies in strategy, not spreadsheets
- Backend operations need modernization
- Lagging in AI adoption

Desired Outcomes:
- Leverage AI for scaling advisory services
- Automate backend operations
- Expand impact without sacrificing client trust
- Increase profits while maintaining personal touch
- Cement position as next-gen financial authority
- Reclaim time for high-value strategy work

Decision Factors: Aims to leverage AI for scaling. Needs systems that elevate authority and amplify reach without sacrificing trust. Ready to shift from bottlenecked service delivery to scalable operations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 PERSONA 4: ALEX RIVERA - The Marketing Agency/Performance Brand
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Profile: Sharp, aggressive marketing agency founder who lives and dies by performance metrics. Big budgets, fast tests, but cracks showing.

Demographics:
- Age: 30-45
- Role: Agency founder/performance marketer
- Business: Digital marketing agency
- Revenue: $500K-$5M/year

Pain Points:
- Rising CPAs eroding competitive edge
- Exhausted creative teams
- Underperforming UGC
- Slow creative production bottlenecks
- Need to outpace slower rivals
- Encountering ineffective follow-up systems

Desired Outcomes:
- Expedited creative processes and performance systems
- Cinematic, conversion-optimized creative
- AI-fueled ad systems
- Radical ROAS gains
- Unlock scalable growth
- Cement reputation as top-tier performance powerhouse

Decision Factors: Needs expedited creative processes. Thrives on performance metrics. Ready for competitive weapon to outpace rivals and scale faster, smarter, more profitably.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UNIVERSAL THEMES ACROSS ALL PERSONAS:
- High-integrity, high-potential operators
- Ready to lead, not lag
- Crave "plug-and-play solutions" but need guidance
- Terrified of falling behind in AI adoption
- Want to save time, unlock scale, look elite
- Need partners who deliver clear wins, not dashboards and jargon`,

  successful_prompts: [
    `[Style: Retro-futuristic mid-century modern with warm earth tones (burnt orange, rust, terracotta) and cool accents (teal, sage green), flat vector style with subtle grain texture, 1950s educational film aesthetic] [Scene: Vintage workspace transitioning from analog chaos (scattered papers, manual typewriters, rotary phones) to digital harmony (organized retro-computer screens, friendly AI assistant robots with space-age design), muted vintage color palette throughout] [Action: 0-3s manual overwhelm and frustration in warm rust tones, 3-6s friendly retro robot introducing alignment system with teal/sage highlights, 6-9s human-AI collaboration creating smooth workflows with geometric patterns, 9-12s Social Alignment brand reveal with space-age orbital motif] [Camera: Smooth educational-style dolly forward, steady framing] [Mood: Optimistic technological nostalgia, warm and inviting]`,

    `[Style: 1950s instructional sequence, flat mid-century illustration with grain overlay, vintage data visualization aesthetic] [Scene: Retro control panel with analog dials and punch cards showing business metrics transforming to streamlined digital displays, warm orange transitioning to cool teal color palette] [Action: 0-3s businessman overwhelmed by manual dials and levers, 3-6s "Alignment Before Automation" principle visualization with geometric transformation, 6-9s systems aligning with space-age precision, 9-12s confident operator with AI co-pilot and Social Alignment tagline] [Visual Elements: Atomic patterns, orbital motions, vintage circuit board aesthetics, clean line work] [Camera: Gentle pan across illustrated scene, minimal depth]`,

    `[Style: Retro-futuristic collaboration scene, mid-century modern office aesthetic, muted vintage color scheme with warm earth tones] [Scene: Human working alongside friendly, simplified geometric robot assistant (think 1950s sci-fi), vintage tech environment with clean lines and balanced composition] [Action: Human-AI partnership sequence showing ideation → automation → growth, transformation from isolated manual work to collaborative innovation, featuring space-age motifs and atomic patterns] [Lighting: Warm-to-cool gradient (rust → sage), soft vintage glow, nostalgic film grain] [Camera: Smooth dolly with slight upward tilt, educational film pacing] [Brand Integration: "AI amplifies human brilliance" messaging, A.L.I.G.N.™ protocol visualization] [Mood: Hopeful 1950s-60s technology optimism meets modern relevance]`,

    `[Style: Vintage educational film meets modern transformation story, retro color grading with desaturated warm/cool palette] [Scene: Split-screen or before/after showing solopreneur drowning in scattered Notion docs and late-night Canva work (left/before: chaotic warm rust tones) versus streamlined AI-assisted operations (right/after: organized teal/sage harmony)] [Action: Problem → Solution → Authority positioning, featuring vintage tech transforming to retro-futuristic systems] [Visual Treatment: Flat vector style, geometric character design, grain texture overlay, 1950s signage and typography] [Camera: Deliberate zoom emphasizing key transformation moments] [Messaging: "Alignment Before Automation" → "Stop grinding, start scaling"]`,

    `[Style: Mid-century modern workspace montage, space-age aesthetic with vintage color treatment] [Scene: Various business scenarios (gym owner, CFO, agency founder, solopreneur) each experiencing transformation through Social Alignment system, unified by retro-futuristic visual language] [Action: 0-3s scattered chaos across different business types (warm tones), 3-6s A.L.I.G.N.™ Protocol introduction with orbital motion graphics, 6-9s personalized AI systems activating for each persona (cool accent colors), 9-12s unified success with Social Alignment authority positioning] [Visual Elements: Atomic patterns, satellite orbits, control panels, vintage screens, geometric shapes] [Mood: Inclusive, optimistic, human-first technological progress]`
  ],

  prohibited_content: [
    '❌ NO modern minimalist aesthetics (purple #8B5CF6, cyan #06B6D4, sleek gradients) - MUST use retro-futuristic mid-century palette',
    '❌ NO cold/sterile contemporary tech aesthetics - MAINTAIN warm, human-first, nostalgic vintage feel',
    '❌ NO generic modern tech startup visuals - REQUIRE space-age 1950s-60s optimism aesthetic',
    '❌ NO harsh lighting or high-contrast digital looks - USE soft vintage glow and warm-to-cool transitions',
    '❌ NO contemporary flat design without character - MUST include grain texture, vintage details, retro typography',
    '❌ NO sleek modern robots or AI - USE friendly, simplified geometric retro robot designs',
    'No copyrighted content or brand logos of other companies',
    'No real people or recognizable individuals without permission',
    'No explicit text or on-screen graphics beyond brand name in final frame',
    'No captions or subtitles baked into video (accessibility overlays acceptable)',
    'Max 45 spoken words if voiceover included (script compliance)',
    'Max 65 syllables total for any narration',
    'Avoid generic stock footage aesthetics - must feel premium, intentional, and brand-aligned',
    'No competitor brand colors, visual styles, or signature elements',
    'No chaotic compositions - maintain balanced, symmetrical mid-century design principles',
    'No dated-looking (in a bad way) visuals - retro aesthetic must feel intentional and elevated, not cheap or accidental',
    '⚠️ CRITICAL: All video content must align with "Alignment Before Automation" philosophy - show human-AI collaboration, not AI replacement'
  ],
};

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function finalUpdate() {
  console.log('🚀 FINAL Social Alignment Brand Update\n');
  console.log('='.repeat(80));
  console.log('\n📊 Brand: Social Alignment');
  console.log('🎯 Purpose: Complete, accurate brand canon for SORA 2 video generation\n');

  // Generate rich embedding from complete brand context
  const embeddingText = `
    ${FINAL_SOCIAL_ALIGNMENT.brand_name}
    ${FINAL_SOCIAL_ALIGNMENT.voice}
    ${FINAL_SOCIAL_ALIGNMENT.visual_style}
    ${FINAL_SOCIAL_ALIGNMENT.icp_profile}
  `.trim();

  console.log('🧠 Generating comprehensive embedding vector...');
  const vector = await generateEmbedding(embeddingText);
  console.log(`✅ Embedding generated (${vector.length} dimensions)\n`);

  console.log('📤 Uploading FINAL brand canon to QDRANT...');
  const result = await upsertBrandCanon(FINAL_SOCIAL_ALIGNMENT, vector);

  if (result.success) {
    console.log('✅ Social Alignment brand SUCCESSFULLY UPDATED!\n');
    console.log('='.repeat(80));
    console.log('\n📋 WHAT WAS UPDATED:\n');
    console.log('✅ Voice & Messaging:');
    console.log('   • Signature phrases: "Alignment Before Automation"');
    console.log('   • "AI amplifies human brilliance, not replace it"');
    console.log('   • A.L.I.G.N.™ Protocol positioning');
    console.log('   • Human-centered AI empowerment tone\n');

    console.log('✅ Visual Style:');
    console.log('   • Retro-Futuristic Mid-Century Modern aesthetic');
    console.log('   • Warm earth tones (rust, orange, terracotta)');
    console.log('   • Cool accents (teal, sage green)');
    console.log('   • 1950s educational film style');
    console.log('   • Optimistic technological nostalgia\n');

    console.log('✅ ICP - 4 Distinct Personas (Dynamically Targetable):');
    console.log('   1. Ethan Brooks - Scalable Solo Founder');
    console.log('   2. Bob Thompson - High-Achieving Gym Owner');
    console.log('   3. Sylvia/Melissa - Accountant/Financial Strategist');
    console.log('   4. Alex Rivera - Marketing Agency/Performance Brand\n');

    console.log('✅ Successful Prompts:');
    console.log('   • 5 comprehensive retro-futuristic prompt templates');
    console.log('   • All featuring mid-century modern aesthetic');
    console.log('   • Human-AI collaboration focus');
    console.log('   • Space-age motifs and vintage color palettes\n');

    console.log('✅ Prohibited Content:');
    console.log('   • NO modern minimalist (purple/cyan)');
    console.log('   • NO cold/sterile tech aesthetics');
    console.log('   • MUST maintain warm, vintage, human-first feel');
    console.log('   • All restrictions documented for compliance\n');

    console.log('='.repeat(80));
    console.log('\n🎯 OFFER SUITE CONTEXT (For reference):');
    console.log('   • BAAS ($1,299) - Brand clarity + positioning');
    console.log('   • CAAS ($5K setup + $3K/mo) - Content automation');
    console.log('   • DAAS ($1K/mo) - CRM + website funnel');
    console.log('   • MAAS ($10-20K/mo) - Ads + SORA 2 creative pipeline');
    console.log('   • AI-AAS ($25K setup + $15K/mo) - Full-stack automation');
    console.log('   • NAAS - Networking event card/contact system\n');

    console.log('📹 SORA 2 INTEGRATION:');
    console.log('   • Included in MAAS (100 creatives/week testing)');
    console.log('   • Available as standalone/à la carte purchase');
    console.log('   • Generates test creative to identify winners');
    console.log('   • Winners get SuperBowl-level production + ad spend\n');

    console.log('='.repeat(80));
    console.log('\n✨ Social Alignment brand canon is now 100% accurate and ready!');
    console.log('🎬 SORA 2 Video Generator can now create on-brand content\n');
  } else {
    console.error('❌ Update failed:', result.error);
  }
}

finalUpdate()
  .then(() => {
    console.log('🎉 Update complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });

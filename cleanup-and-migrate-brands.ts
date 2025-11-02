// Cleanup test brands and add REAL client brands to QDRANT
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

import { OpenAI } from 'openai';
import { deleteBrandCanon, upsertBrandCanon, getAllBrands } from './src/lib/qdrant-client';
import type { BrandCanon } from './src/types/brand-canon';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Test brands to DELETE
const TEST_BRANDS_TO_DELETE = [
  'test-brand-1',
  'test-brand-2',
  'test-brand-3',
  'test-brand-4',
  'test-brand-5',
  'test-brand-6',
  'test-brand-7',
  'test-brand-8',
];

// REAL CLIENT BRANDS - Template structure (will use brand onboarding workflow for full context)
const REAL_CLIENT_BRANDS: Partial<BrandCanon>[] = [
  {
    brand_id: 'earth-breeze',
    brand_name: 'Earth Breeze',
    // Full context to be gathered via brand-onboarding workflow
  },
  {
    brand_id: 'rocket-benefits',
    brand_name: 'Rocket Benefits',
  },
  {
    brand_id: 'wementality',
    brand_name: 'WeMentality',
  },
  {
    brand_id: 'the-lemonade-stand-business-plan',
    brand_name: 'The Lemonade Stand Business Plan',
  },
  {
    brand_id: 'fun-earth-co',
    brand_name: 'Fun Earth Co',
    // Note: Mushroom Coffee
  },
  {
    brand_id: 'gym-academy',
    brand_name: 'Gym Academy',
  },
  {
    brand_id: 'jollyj-photography',
    brand_name: 'JollyJ Photography',
  },
  {
    brand_id: 'in-the-black-consulting',
    brand_name: 'In The Black Consulting',
  },
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function cleanupAndMigrate() {
  console.log('🧹 QDRANT Brand Cleanup & Real Client Migration\n');
  console.log('='.repeat(80));

  // Step 1: Show current state
  console.log('\n📊 Step 1: Current QDRANT State\n');
  const currentBrands = await getAllBrands({ limit: 50 });
  console.log(`Total brands in database: ${currentBrands.brands.length}`);
  console.log('\nCurrent brands:');
  currentBrands.brands.forEach((brand, idx) => {
    console.log(`  ${idx + 1}. ${brand.brand_name} (${brand.brand_id})`);
  });

  // Step 2: Delete test brands
  console.log('\n\n🗑️  Step 2: Deleting Test Brands\n');
  console.log('-'.repeat(80));

  let deletedCount = 0;
  for (const testBrandId of TEST_BRANDS_TO_DELETE) {
    try {
      const result = await deleteBrandCanon(testBrandId);
      if (result) {
        console.log(`✅ Deleted: ${testBrandId}`);
        deletedCount++;
      } else {
        console.log(`⚠️  Could not delete: ${testBrandId} (may not exist)`);
      }
    } catch (error) {
      console.error(`❌ Error deleting ${testBrandId}:`, error);
    }
  }

  console.log(`\n✅ Deleted ${deletedCount} test brands`);

  // Step 3: Add placeholder entries for real clients
  console.log('\n\n📥 Step 3: Creating Placeholder Entries for Real Clients\n');
  console.log('-'.repeat(80));
  console.log('⚠️  NOTE: These are PLACEHOLDER entries with minimal data.');
  console.log('⚠️  Use /brand-onboard workflow to gather comprehensive context for each client.\n');

  let addedCount = 0;
  for (const clientBrand of REAL_CLIENT_BRANDS) {
    const brandId = clientBrand.brand_id!;
    const brandName = clientBrand.brand_name!;

    // Create minimal placeholder brand
    const placeholderBrand: BrandCanon = {
      brand_id: brandId,
      brand_name: brandName,
      voice: `[PLACEHOLDER] Professional brand voice - Run /brand-onboard to gather comprehensive voice profile for ${brandName}`,
      visual_style: `[PLACEHOLDER] Visual style description needed - Run /brand-onboard to define complete visual aesthetic for ${brandName}`,
      icp_profile: `[PLACEHOLDER] Target audience profile needed - Run /brand-onboard to define ICP for ${brandName}`,
      successful_prompts: [
        `[PLACEHOLDER] Successful Sora 2 prompt patterns to be gathered via brand onboarding workflow for ${brandName}`,
      ],
      prohibited_content: [
        '[PLACEHOLDER] Content restrictions to be defined during brand onboarding',
        'No copyrighted content',
        'No real people without permission',
      ],
    };

    try {
      // Generate minimal embedding
      const embeddingText = `${brandName} brand placeholder`;
      const vector = await generateEmbedding(embeddingText);

      // Upload to QDRANT
      const result = await upsertBrandCanon(placeholderBrand, vector);

      if (result.success) {
        console.log(`✅ Added placeholder: ${brandName} (${brandId})`);
        addedCount++;
      } else {
        console.error(`❌ Failed to add ${brandName}: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error adding ${brandName}:`, error);
    }
  }

  console.log(`\n✅ Added ${addedCount} client brand placeholders`);

  // Step 4: Show updated state
  console.log('\n\n📊 Step 4: Updated QDRANT State\n');
  console.log('-'.repeat(80));
  const updatedBrands = await getAllBrands({ limit: 50 });
  console.log(`Total brands in database: ${updatedBrands.brands.length}\n`);

  console.log('Brands by category:\n');

  console.log('🏢 PRODUCTION BRANDS:');
  const productionBrands = updatedBrands.brands.filter(
    b => b.brand_id === 'social-alignment' || b.brand_id === 'demo-brand'
  );
  productionBrands.forEach(brand => {
    console.log(`  ✅ ${brand.brand_name} (${brand.brand_id})`);
  });

  console.log('\n👥 CLIENT BRANDS (Placeholder - needs full onboarding):');
  const clientBrands = updatedBrands.brands.filter(
    b => b.brand_id !== 'social-alignment' &&
         b.brand_id !== 'demo-brand' &&
         !b.brand_id.startsWith('test-')
  );
  clientBrands.forEach((brand, idx) => {
    console.log(`  ${idx + 1}. ${brand.brand_name} (${brand.brand_id})`);
  });

  // Step 5: Next steps guidance
  console.log('\n\n📋 Step 5: Next Steps - Complete Brand Onboarding\n');
  console.log('='.repeat(80));
  console.log('\nTo gather comprehensive brand context for each client, run:\n');
  console.log('  /brand-onboard\n');
  console.log('This workflow will systematically collect:');
  console.log('  • Core brand identity & voice');
  console.log('  • Visual style & cinematography preferences');
  console.log('  • Target audience intelligence (ICP)');
  console.log('  • Content strategy & pillars');
  console.log('  • Platform-specific variations');
  console.log('  • Sora 2 technical preferences');
  console.log('  • Successful content patterns');
  console.log('  • Content restrictions & compliance');
  console.log('  • Competitive differentiation');
  console.log('  • Audio, typography & motion preferences');
  console.log('\nRecommended order:');
  clientBrands.forEach((brand, idx) => {
    console.log(`  ${idx + 1}. Run /brand-onboard for ${brand.brand_name}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Cleanup & Migration Complete!\n');
}

// Run cleanup and migration
cleanupAndMigrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

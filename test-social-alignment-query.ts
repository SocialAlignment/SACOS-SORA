// Test script to query Social Alignment brand from QDRANT
// Proves connectivity and retrieves all brand context

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

import { queryBrandCanon, getAllBrands, checkQdrantHealth } from './src/lib/qdrant-client';

async function testSocialAlignmentQuery() {
  console.log('🔍 Testing QDRANT Connection and Social Alignment Brand Query\n');
  console.log('=' .repeat(80));

  // Step 1: Health Check
  console.log('\n📡 Step 1: QDRANT Health Check...');
  const isHealthy = await checkQdrantHealth();

  if (!isHealthy) {
    console.error('❌ QDRANT health check failed. Cannot proceed.');
    process.exit(1);
  }

  console.log('✅ QDRANT is healthy and accessible\n');

  // Step 2: Query Social Alignment Brand
  console.log('🎯 Step 2: Querying Social Alignment Brand...\n');
  const socialAlignment = await queryBrandCanon('social-alignment');

  if (!socialAlignment) {
    console.error('❌ Social Alignment brand not found in QDRANT');
    process.exit(1);
  }

  console.log('✅ Social Alignment Brand Retrieved!\n');
  console.log('=' .repeat(80));
  console.log('\n📊 COMPLETE BRAND CONTEXT FOR SOCIAL ALIGNMENT:\n');
  console.log('=' .repeat(80));

  // Display all brand data
  console.log('\n🆔 BRAND IDENTITY');
  console.log('-'.repeat(80));
  console.log(`Brand ID: ${socialAlignment.brand_id}`);
  console.log(`Brand Name: ${socialAlignment.brand_name}`);

  console.log('\n🎤 BRAND VOICE & PERSONALITY');
  console.log('-'.repeat(80));
  console.log(socialAlignment.voice);

  console.log('\n🎨 VISUAL STYLE & CINEMATOGRAPHY');
  console.log('-'.repeat(80));
  console.log(socialAlignment.visual_style);

  console.log('\n👥 IDEAL CUSTOMER PROFILE (ICP)');
  console.log('-'.repeat(80));
  console.log(socialAlignment.icp_profile);

  console.log('\n✅ SUCCESSFUL PROMPTS (Proven Patterns)');
  console.log('-'.repeat(80));
  socialAlignment.successful_prompts.forEach((prompt, index) => {
    console.log(`\n[${index + 1}] ${prompt}`);
  });

  console.log('\n🚫 PROHIBITED CONTENT (Brand Restrictions)');
  console.log('-'.repeat(80));
  socialAlignment.prohibited_content.forEach((restriction, index) => {
    console.log(`${index + 1}. ${restriction}`);
  });

  console.log('\n' + '='.repeat(80));

  // Step 3: Show all brands in database
  console.log('\n📚 Step 3: All Brands in QDRANT Database...\n');
  const allBrandsResult = await getAllBrands({ limit: 50 });

  console.log(`Total Brands Found: ${allBrandsResult.brands.length}`);
  console.log('\nBrand List:');
  allBrandsResult.brands.forEach((brand, index) => {
    console.log(`  ${index + 1}. ${brand.brand_name} (${brand.brand_id})`);
  });

  if (allBrandsResult.nextOffset) {
    console.log(`\n(More brands available - pagination offset: ${allBrandsResult.nextOffset})`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Test Complete - QDRANT Connection Verified!');
  console.log('📊 Social Alignment brand context fully accessible\n');
}

// Run test
testSocialAlignmentQuery()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

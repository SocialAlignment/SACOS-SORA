// Performance Test Script (Story 1.2 - AC#5)
// Verifies <500ms query response time with 10 test brands

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { OpenAI } from 'openai';
import type { BrandCanon } from '@/types/brand-canon';
import {
  upsertBrandCanon,
  searchBrands,
  getAllBrands,
  checkQdrantHealth,
} from '@/lib/qdrant-client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate embedding for text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Create test brands (8 additional to reach 10 total)
 */
const TEST_BRANDS: BrandCanon[] = [
  {
    brand_id: 'test-brand-1',
    brand_name: 'TechFlow Solutions',
    voice: 'Professional, authoritative, tech-savvy',
    visual_style: 'Modern corporate, blue and silver color scheme',
    icp_profile: 'Enterprise IT decision makers, ages 40-60',
    successful_prompts: ['Corporate office transformation scenes'],
    prohibited_content: ['No competitor logos'],
  },
  {
    brand_id: 'test-brand-2',
    brand_name: 'Creative Studio Co',
    voice: 'Playful, energetic, inspiring',
    visual_style: 'Colorful, dynamic, artistic aesthetic',
    icp_profile: 'Creative professionals, ages 25-40',
    successful_prompts: ['Artistic transformation sequences'],
    prohibited_content: ['No copyrighted art'],
  },
  {
    brand_id: 'test-brand-3',
    brand_name: 'HealthWise Partners',
    voice: 'Caring, trustworthy, educational',
    visual_style: 'Clean, medical-grade, green and white tones',
    icp_profile: 'Healthcare administrators, ages 35-55',
    successful_prompts: ['Healthcare environment visuals'],
    prohibited_content: ['No medical misinformation'],
  },
  {
    brand_id: 'test-brand-4',
    brand_name: 'EcoVenture Brands',
    voice: 'Passionate, eco-conscious, optimistic',
    visual_style: 'Natural, earth tones, outdoor settings',
    icp_profile: 'Environmentally conscious consumers, ages 25-45',
    successful_prompts: ['Nature and sustainability scenes'],
    prohibited_content: ['No greenwashing'],
  },
  {
    brand_id: 'test-brand-5',
    brand_name: 'FinanceFirst Advisors',
    voice: 'Confident, knowledgeable, strategic',
    visual_style: 'Premium, dark blue and gold, financial charts',
    icp_profile: 'High-net-worth individuals, ages 45-65',
    successful_prompts: ['Financial growth visualizations'],
    prohibited_content: ['No investment guarantees'],
  },
  {
    brand_id: 'test-brand-6',
    brand_name: 'EduTech Innovations',
    voice: 'Friendly, accessible, empowering',
    visual_style: 'Bright, educational, interactive elements',
    icp_profile: 'Educators and students, ages 18-50',
    successful_prompts: ['Learning environment scenes'],
    prohibited_content: ['No false academic claims'],
  },
  {
    brand_id: 'test-brand-7',
    brand_name: 'FitLife Athletics',
    voice: 'Motivational, energetic, results-driven',
    visual_style: 'Dynamic, high-energy, athletic aesthetics',
    icp_profile: 'Fitness enthusiasts, ages 20-40',
    successful_prompts: ['Athletic performance visuals'],
    prohibited_content: ['No unrealistic body standards'],
  },
  {
    brand_id: 'test-brand-8',
    brand_name: 'LuxuryLiving Estates',
    voice: 'Sophisticated, exclusive, elegant',
    visual_style: 'Premium, luxury aesthetics, golden hour lighting',
    icp_profile: 'Luxury property buyers, ages 40-70',
    successful_prompts: ['Luxury real estate showcases'],
    prohibited_content: ['No misleading pricing'],
  },
];

/**
 * Seed test brands
 */
async function seedTestBrands() {
  console.log('\n📦 Seeding 8 test brands...');

  for (const brand of TEST_BRANDS) {
    const text = `${brand.brand_name} ${brand.voice} ${brand.visual_style} ${brand.icp_profile}`;
    const vector = await generateEmbedding(text);
    const success = await upsertBrandCanon(brand, vector);

    if (success) {
      console.log(`  ✅ ${brand.brand_name} loaded`);
    } else {
      console.error(`  ❌ ${brand.brand_name} failed`);
    }
  }
}

/**
 * Performance benchmark: Run 100 vector search queries
 */
async function runPerformanceBenchmark() {
  console.log('\n🚀 Running performance benchmark...');
  console.log('Target: <500ms average query time across 100 queries\n');

  // Test queries covering different search terms
  const testQueries = [
    'professional tech company',
    'creative design studio',
    'healthcare solutions',
    'environmental sustainability',
    'financial advisory',
    'educational technology',
    'fitness and wellness',
    'luxury real estate',
    'corporate transformation',
    'innovative brand',
  ];

  const latencies: number[] = [];
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    const queryText = testQueries[i % testQueries.length];
    const queryVector = await generateEmbedding(queryText);

    const startTime = Date.now();
    await searchBrands(queryVector, 5);
    const endTime = Date.now();

    const latency = endTime - startTime;
    latencies.push(latency);

    if ((i + 1) % 20 === 0) {
      console.log(`  Completed ${i + 1}/${iterations} queries...`);
    }
  }

  // Calculate statistics
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);
  const minLatency = Math.min(...latencies);
  const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

  console.log('\n📊 Performance Results:');
  console.log(`  Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`  Min Latency: ${minLatency.toFixed(2)}ms`);
  console.log(`  Max Latency: ${maxLatency.toFixed(2)}ms`);
  console.log(`  P95 Latency: ${p95Latency.toFixed(2)}ms`);

  // AC#5 verification
  const passed = avgLatency < 500;
  console.log(`\n${passed ? '✅' : '❌'} AC#5 Requirement: Average query time <500ms`);
  console.log(`  Target: <500ms`);
  console.log(`  Actual: ${avgLatency.toFixed(2)}ms`);
  console.log(`  Status: ${passed ? 'PASSED' : 'FAILED'}`);

  return { avgLatency, maxLatency, minLatency, p95Latency, passed };
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🧪 QDRANT Performance Test (Story 1.2 - AC#5)');
  console.log('='.repeat(50));

  // Check health
  const isHealthy = await checkQdrantHealth();
  if (!isHealthy) {
    console.error('\n❌ QDRANT health check failed');
    process.exit(1);
  }
  console.log('✅ QDRANT connection healthy');

  // Get current brand count
  const existingBrands = await getAllBrands();
  console.log(`\n📋 Current brands in database: ${existingBrands.length}`);

  // Seed test brands if needed
  if (existingBrands.length < 10) {
    await seedTestBrands();
    const updatedBrands = await getAllBrands();
    console.log(`\n✅ Total brands after seeding: ${updatedBrands.length}`);
  }

  // Run performance benchmark
  const results = await runPerformanceBenchmark();

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Performance test complete!');

  return results;
}

// Run if executed directly
if (require.main === module) {
  runTests()
    .then((results) => {
      process.exit(results.passed ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { runTests, seedTestBrands, runPerformanceBenchmark };

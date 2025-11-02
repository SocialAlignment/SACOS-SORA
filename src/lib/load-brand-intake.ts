// Load Brand from Intake YAML (Story 1.2 Extension)
// Process brand intake template and load into QDRANT

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'yaml';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { OpenAI } from 'openai';
import type { BrandCanon } from '@/types/brand-canon';
import { upsertBrandCanon, queryBrandCanon } from '@/lib/qdrant-client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Brand Intake Format (matches YAML template)
 */
interface BrandIntake {
  brand_id: string;
  brand_name: string;
  voice: string;
  visual_style: string;
  icp_profile: string;
  successful_prompts: string[];
  prohibited_content: string[];
  // Optional fields
  brand_values?: string;
  key_features?: string;
  signature_phrases?: string[];
  platform_notes?: {
    tiktok?: string;
    instagram?: string;
    linkedin?: string;
  };
  content_themes?: string[];
}

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
 * Load brand intake YAML file
 */
function loadBrandIntakeFile(filePath: string): BrandIntake {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const intake = yaml.parse(fileContent) as BrandIntake;

  // Validate required fields
  const requiredFields = [
    'brand_id',
    'brand_name',
    'voice',
    'visual_style',
    'icp_profile',
  ];

  for (const field of requiredFields) {
    if (!intake[field as keyof BrandIntake] || intake[field as keyof BrandIntake] === '') {
      throw new Error(
        `Missing required field: ${field} in ${filePath}`
      );
    }
  }

  // Ensure arrays exist
  if (!intake.successful_prompts) intake.successful_prompts = [];
  if (!intake.prohibited_content) intake.prohibited_content = [];

  // Filter out empty strings from arrays
  intake.successful_prompts = intake.successful_prompts.filter(
    (p) => p && p.trim() !== ''
  );
  intake.prohibited_content = intake.prohibited_content.filter(
    (c) => c && c.trim() !== ''
  );

  return intake;
}

/**
 * Convert intake format to BrandCanon
 */
function intakeToBrandCanon(intake: BrandIntake): BrandCanon {
  return {
    brand_id: intake.brand_id,
    brand_name: intake.brand_name,
    voice: intake.voice.trim(),
    visual_style: intake.visual_style.trim(),
    icp_profile: intake.icp_profile.trim(),
    successful_prompts: intake.successful_prompts,
    prohibited_content: intake.prohibited_content,
  };
}

/**
 * Load single brand from intake file
 */
async function loadBrand(filePath: string, overwrite: boolean = false) {
  console.log(`\n📄 Loading brand from: ${filePath}`);

  // Load and validate intake
  const intake = loadBrandIntakeFile(filePath);
  console.log(`  Brand: ${intake.brand_name} (${intake.brand_id})`);

  // Check if brand already exists
  const existing = await queryBrandCanon(intake.brand_id);
  if (existing && !overwrite) {
    console.log(
      `  ⚠️  Brand ${intake.brand_id} already exists. Use --overwrite to replace.`
    );
    return false;
  }

  // Convert to BrandCanon format
  const brandCanon = intakeToBrandCanon(intake);

  // Generate embedding from brand text
  console.log('  Generating embedding...');
  const embeddingText = `${brandCanon.brand_name} ${brandCanon.voice} ${brandCanon.visual_style} ${brandCanon.icp_profile}`;
  const vector = await generateEmbedding(embeddingText);

  // Upsert to QDRANT
  console.log('  Uploading to QDRANT...');
  const success = await upsertBrandCanon(brandCanon, vector);

  if (success) {
    console.log(
      `  ✅ ${intake.brand_name} loaded successfully${existing ? ' (updated)' : ''}`
    );
    return true;
  } else {
    console.error(`  ❌ Failed to load ${intake.brand_name}`);
    return false;
  }
}

/**
 * Load multiple brands from directory
 */
async function loadBrandsFromDirectory(
  dirPath: string,
  overwrite: boolean = false
) {
  console.log(`\n📂 Loading brands from directory: ${dirPath}`);

  const files = fs
    .readdirSync(dirPath)
    .filter(
      (f) =>
        (f.startsWith('brand-intake-') && f.endsWith('.yaml')) ||
        f.endsWith('.yml')
    );

  if (files.length === 0) {
    console.log('  No brand intake files found (brand-intake-*.yaml)');
    return;
  }

  console.log(`  Found ${files.length} brand intake file(s)\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      const success = await loadBrand(filePath, overwrite);
      if (success) successCount++;
    } catch (error) {
      console.error(`  ❌ Error loading ${file}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully loaded: ${successCount}`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`);
  }
}

/**
 * CLI Usage
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📋 Brand Intake Loader

Usage:
  npx tsx src/lib/load-brand-intake.ts <file-or-directory> [--overwrite]

Examples:
  # Load single brand
  npx tsx src/lib/load-brand-intake.ts brand-intake-earth-breeze.yaml

  # Load all brands from current directory
  npx tsx src/lib/load-brand-intake.ts .

  # Load with overwrite (replace existing brands)
  npx tsx src/lib/load-brand-intake.ts brand-intakes/ --overwrite

Template:
  Copy brand-intake-template.yaml and fill it out for each brand.
    `);
    process.exit(0);
  }

  const target = args[0];
  const overwrite = args.includes('--overwrite');

  if (!fs.existsSync(target)) {
    console.error(`❌ Path does not exist: ${target}`);
    process.exit(1);
  }

  const stats = fs.statSync(target);

  if (stats.isDirectory()) {
    await loadBrandsFromDirectory(target, overwrite);
  } else if (stats.isFile()) {
    await loadBrand(target, overwrite);
  } else {
    console.error(`❌ Invalid path type: ${target}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Brand loading complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Brand loading failed:', error);
      process.exit(1);
    });
}

export { loadBrand, loadBrandsFromDirectory, intakeToBrandCanon };

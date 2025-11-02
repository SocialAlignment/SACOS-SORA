// Query Qdrant for "social alignment" brand canon data
import { queryBrandCanon, searchBrands } from './src/lib/qdrant-client';

async function querySocialAlignment() {
  console.log('=== Querying Qdrant for "Social Alignment" ===\n');

  // Try exact brand ID match first
  console.log('1. Exact brand ID lookup: "social-alignment"');
  try {
    const exactMatch = await queryBrandCanon('social-alignment');
    if (exactMatch) {
      console.log('\n✓ Found exact match!\n');
      console.log(JSON.stringify(exactMatch, null, 2));
    } else {
      console.log('✗ No exact match found\n');
    }
  } catch (error) {
    console.log('✗ Error:', error instanceof Error ? error.message : error);
  }

  // Try semantic search
  console.log('\n2. Semantic search for "social alignment"');
  try {
    const searchResults = await searchBrands('social alignment', { limit: 5 });
    if (searchResults.length > 0) {
      console.log(`\n✓ Found ${searchResults.length} results:\n`);
      searchResults.forEach((result, index) => {
        console.log(`\n--- Result ${index + 1} (Score: ${result.score.toFixed(4)}) ---`);
        console.log(`Brand ID: ${result.brand.brand_id}`);
        console.log(`Brand Name: ${result.brand.brand_name}`);
        console.log(`Voice: ${result.brand.voice.substring(0, 200)}...`);
        console.log(`Visual Style: ${result.brand.visual_style.substring(0, 200)}...`);
        console.log(`ICP Profile: ${result.brand.icp_profile.substring(0, 200)}...`);
        console.log(`Successful Prompts: ${result.brand.successful_prompts.length} examples`);
        console.log(`Prohibited Content: ${result.brand.prohibited_content.length} rules`);
      });
    } else {
      console.log('✗ No semantic search results found');
    }
  } catch (error) {
    console.log('✗ Error:', error instanceof Error ? error.message : error);
  }

  // Also try alternative ID formats
  console.log('\n3. Trying alternative brand ID formats...');
  const alternativeIds = ['social_alignment', 'socialalignment', 'Social Alignment', 'SOCIAL ALIGNMENT'];

  for (const brandId of alternativeIds) {
    try {
      const result = await queryBrandCanon(brandId);
      if (result) {
        console.log(`\n✓ Found match with ID: "${brandId}"`);
        console.log(JSON.stringify(result, null, 2));
        break;
      }
    } catch (error) {
      // Silent fail, continue trying
    }
  }

  console.log('\n=== Query Complete ===');
}

querySocialAlignment().catch(console.error);

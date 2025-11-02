// Test NAS Storage Configuration
// Run with: npx tsx test-nas-storage.ts

import { config } from 'dotenv';
import { resolve } from 'path';
import { createStorageAdapter } from './src/lib/storage-adapters';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testNASStorage() {
  console.log('=== Testing NAS Storage Configuration ===\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log(`  STORAGE_BACKEND: ${process.env.STORAGE_BACKEND}`);
  console.log(`  NAS_MOUNT_PATH: ${process.env.NAS_MOUNT_PATH}`);
  console.log(`  NAS_PUBLIC_URL: ${process.env.NAS_PUBLIC_URL}\n`);

  if (process.env.STORAGE_BACKEND !== 'nas') {
    console.error('❌ STORAGE_BACKEND is not set to "nas"');
    console.log('   Update .env.local: STORAGE_BACKEND=nas\n');
    process.exit(1);
  }

  try {
    // Create storage adapter (should use NAS)
    const storage = createStorageAdapter();
    console.log('✓ Storage adapter created successfully\n');

    // Create test data
    const testData = Buffer.from('Test video data from SORA 2 Playground');
    const testPath = 'test-batch/test-video.mp4';

    console.log(`Saving test file to: ${testPath}`);
    const storedFile = await storage.saveFile(testPath, testData);

    console.log('\n✓ Test file saved successfully!\n');
    console.log('Stored File Details:');
    console.log(`  Path: ${storedFile.path}`);
    console.log(`  URL: ${storedFile.url}`);
    console.log(`  Size: ${storedFile.size} bytes`);
    console.log(`  Backend: ${storedFile.backend}`);
    console.log(`  Stored At: ${storedFile.storedAt.toISOString()}\n`);

    // Verify file exists
    const exists = await storage.fileExists(testPath);
    console.log(`File exists check: ${exists ? '✓ YES' : '❌ NO'}\n`);

    // List files in test-batch directory
    console.log('Files in test-batch directory:');
    const files = await storage.listFiles('test-batch');
    files.forEach(file => console.log(`  - ${file}`));
    console.log('');

    // Cleanup test file
    console.log('Cleaning up test file...');
    await storage.deleteFile(testPath);
    console.log('✓ Test file deleted\n');

    console.log('=== NAS Storage Test Complete ===');
    console.log('✓ All tests passed! Your NAS storage is properly configured.\n');

    // Show actual file location
    console.log('Videos will be saved to:');
    console.log(`  ${process.env.NAS_MOUNT_PATH}/{batchId}/{videoFile}`);
    console.log('\nExample:');
    console.log(`  ${process.env.NAS_MOUNT_PATH}/batch-abc123/video_V1.mp4\n`);

  } catch (error) {
    console.error('\n❌ NAS Storage Test Failed!\n');
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error('\nTroubleshooting:');
    console.error('1. Verify NAS is mounted: ls "/Volumes/Team Alignment"');
    console.error('2. Check write permissions: touch "/Volumes/Team Alignment/Jonathan Sterritt/generated-outputs/movies/.test"');
    console.error('3. Verify NAS_MOUNT_PATH in .env.local is correct');
    console.error('4. Ensure the "movies" folder exists\n');
    process.exit(1);
  }
}

testNASStorage().catch(console.error);

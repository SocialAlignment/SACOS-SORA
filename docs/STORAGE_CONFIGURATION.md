# Storage Configuration Guide

The SORA 2 Playground supports multiple storage backends for generated videos, thumbnails, and spritesheets.

## Supported Storage Backends

### 1. Local Storage (Default)
Stores files in the Next.js `./public/generated-videos` directory.

**Configuration:**
```bash
STORAGE_BACKEND=local
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Pros:**
- No external dependencies
- Fast local access
- Simple setup

**Cons:**
- Limited to single-server deployment
- No automatic backups
- Storage limited by disk space

---

### 2. NAS (Network Attached Storage)
Stores files on a mounted network volume (e.g., Synology, QNAP, macOS Server).

**Configuration:**
```bash
STORAGE_BACKEND=nas
NAS_MOUNT_PATH=/Volumes/TeamShare/generated-videos
NAS_PUBLIC_URL=http://nas.local/generated-videos
```

**Setup Steps:**
1. Mount your NAS volume on the server
2. Ensure the mount point is accessible (check with `ls /Volumes/TeamShare`)
3. Configure NAS HTTP server for public file access
4. Set environment variables

**Pros:**
- Centralized storage for team access
- Automatic backups (if configured on NAS)
- Large storage capacity

**Cons:**
- Requires network mount
- Depends on network reliability
- Requires NAS HTTP server setup

**Troubleshooting:**
- If mount fails, check: `mount | grep "/Volumes/TeamShare"`
- Verify permissions: `ls -la /Volumes/TeamShare`
- Test write access: `touch /Volumes/TeamShare/test.txt`

---

### 3. Google Drive
Stores files in Google Drive using the Drive API v3.

**Configuration:**
```bash
STORAGE_BACKEND=google-drive
GOOGLE_DRIVE_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
```

**Setup Steps:**

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable Google Drive API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"

#### Step 2: Create Service Account
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in service account details:
   - Name: `sora-video-storage`
   - Role: `Editor` (or custom role with Drive access)
4. Click "Done"

#### Step 3: Generate Service Account Key
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Download the key file

#### Step 4: Share Drive Folder with Service Account
1. Create a folder in Google Drive (or use existing)
2. Right-click folder → "Share"
3. Add the service account email (e.g., `sora-video-storage@project.iam.gserviceaccount.com`)
4. Grant "Editor" permissions
5. Copy the folder ID from the URL:
   - URL: `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j`
   - Folder ID: `1a2b3c4d5e6f7g8h9i0j`

#### Step 5: Configure Environment Variables
```bash
# Convert JSON key file to single-line string
GOOGLE_DRIVE_CREDENTIALS='{"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"sora-video-storage@project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}'

# Set folder ID
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
```

**Pros:**
- Cloud-based, accessible anywhere
- Automatic backups and versioning
- Virtually unlimited storage (with paid plans)
- Built-in file sharing capabilities

**Cons:**
- Requires Google Cloud setup
- API rate limits (1000 requests/100 seconds/user)
- Upload latency (network-dependent)
- Cost for storage and API usage

**File Structure in Google Drive:**
```
SORA Videos (root folder)
├── batch-abc123/
│   ├── video_V1.mp4
│   ├── video_V1_thumbnail.webp
│   └── video_V1_spritesheet.jpg
└── batch-def456/
    ├── video_V1.mp4
    └── video_V1_thumbnail.webp
```

**Troubleshooting:**
- **Authentication Errors**: Verify service account credentials are valid JSON
- **Permission Denied**: Ensure service account has Editor access to the folder
- **Rate Limit Exceeded**: Implement exponential backoff or request quota increase
- **Missing Files**: Check folder ID is correct and folder exists

---

## Architecture

### Storage Adapter Interface

All storage backends implement the `StorageAdapter` interface:

```typescript
interface StorageAdapter {
  saveFile(relativePath: string, data: Buffer): Promise<StoredFile>;
  getFileUrl(relativePath: string): string;
  fileExists(relativePath: string): Promise<boolean>;
  deleteFile(relativePath: string): Promise<void>;
  listFiles(directory: string): Promise<string[]>;
}
```

### Storage Adapter Factory

The `createStorageAdapter()` factory function selects the appropriate adapter based on `STORAGE_BACKEND` environment variable:

```typescript
import { createStorageAdapter } from '@/lib/storage-adapters';

// Automatically selects adapter based on STORAGE_BACKEND
const storage = createStorageAdapter();

// Or inject custom adapter for testing
const storage = new LocalStorageAdapter('/custom/path');
```

### Integration with Asset Download Manager

The `AssetDownloadManager` uses the storage adapter to save video assets:

```typescript
import { assetDownloadManager } from '@/lib/asset-download-manager';

// Downloads and stores video using configured storage backend
await assetDownloadManager.queueDownload(
  notionPageId,
  soraVideoId,
  batchId,
  completedAt
);
```

---

## File Versioning

All storage backends support automatic file versioning:

```
batch-123/
├── vid001_V1.mp4        # First version
├── vid001_V2.mp4        # Regenerated version
├── vid001_V3.mp4        # Another regeneration
```

Versioning logic:
1. Check existing files in batch directory
2. Find highest version number (e.g., `_V2`)
3. Increment version for new file (e.g., `_V3`)

---

## Switching Storage Backends

To switch storage backends, update `.env.local`:

```bash
# Change from local to NAS
STORAGE_BACKEND=nas
NAS_MOUNT_PATH=/Volumes/TeamShare/generated-videos
NAS_PUBLIC_URL=http://nas.local/generated-videos
```

Restart the Next.js server:
```bash
npm run dev
```

**Note**: Existing files won't automatically migrate. Use a migration script if needed.

---

## Migration Between Storage Backends

### Local → NAS
```bash
# Copy all files from local to NAS
rsync -avz ./public/generated-videos/ /Volumes/TeamShare/generated-videos/
```

### Local → Google Drive
```bash
# Install rclone
brew install rclone

# Configure rclone with Google Drive
rclone config

# Sync files
rclone copy ./public/generated-videos/ gdrive:SORA-Videos/
```

### NAS → Google Drive
```bash
rclone copy /Volumes/TeamShare/generated-videos/ gdrive:SORA-Videos/
```

---

## Best Practices

### Local Storage
- ✅ Use for development and testing
- ✅ Implement disk space monitoring
- ❌ Avoid for production multi-server deployments

### NAS Storage
- ✅ Use for team environments with centralized storage
- ✅ Configure automatic NAS backups
- ✅ Monitor network mount status
- ❌ Avoid if network reliability is poor

### Google Drive
- ✅ Use for cloud-based deployments
- ✅ Implement API rate limit handling
- ✅ Monitor storage quota and API usage
- ❌ Avoid for high-frequency, low-latency requirements

---

## Testing Storage Adapters

### Test Local Storage
```typescript
import { LocalStorageAdapter } from '@/lib/storage-adapters';

const storage = new LocalStorageAdapter();
const testData = Buffer.from('test video data');

const stored = await storage.saveFile('test-batch/video.mp4', testData);
console.log('File URL:', stored.url);
```

### Test NAS Storage
```typescript
import { NASStorageAdapter } from '@/lib/storage-adapters';

const storage = new NASStorageAdapter('/Volumes/TeamShare/generated-videos');
const testData = Buffer.from('test video data');

const stored = await storage.saveFile('test-batch/video.mp4', testData);
console.log('File URL:', stored.url);
```

### Test Google Drive Storage
```typescript
import { GoogleDriveStorageAdapter } from '@/lib/storage-adapters';

const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS!);
const storage = new GoogleDriveStorageAdapter(credentials, 'folder-id');

const testData = Buffer.from('test video data');
const stored = await storage.saveFile('test-batch/video.mp4', testData);
console.log('File URL:', stored.url);
```

---

## Monitoring and Debugging

### Enable Debug Logging
```typescript
// In storage-adapters.ts, logging is already enabled
console.log(`[Local Storage] Saved file to ${fullPath}`);
console.log(`[NAS Storage] Saved file to ${fullPath}`);
console.log(`[Google Drive Storage] Uploaded file: ${response.data.id}`);
```

### Monitor Storage Usage
```bash
# Local/NAS
du -sh ./public/generated-videos/
du -sh /Volumes/TeamShare/generated-videos/

# Google Drive (use Drive API)
# Check quota at: https://console.cloud.google.com/apis/api/drive.googleapis.com/quotas
```

### Error Handling
All storage adapters throw errors for failed operations:
- `saveFile()`: Network errors, permission denied, disk full
- `fileExists()`: Permission denied, mount errors
- `deleteFile()`: Permission denied, file not found

Implement try-catch in calling code:
```typescript
try {
  const stored = await storage.saveFile(path, data);
} catch (error) {
  console.error('Storage error:', error);
  // Implement retry or fallback logic
}
```

---

## Support and Troubleshooting

### Common Issues

**Issue**: "ENOENT: no such file or directory"
- **Cause**: Local path doesn't exist or NAS not mounted
- **Fix**: Check path existence, remount NAS

**Issue**: "Google Drive API 403 Forbidden"
- **Cause**: Service account lacks permissions
- **Fix**: Share Drive folder with service account email

**Issue**: "Network timeout"
- **Cause**: Slow network or API rate limiting
- **Fix**: Implement retry logic, check network connectivity

**Issue**: "Disk quota exceeded"
- **Cause**: Storage backend is full
- **Fix**: Increase storage capacity or implement cleanup

---

## Future Enhancements

- [ ] AWS S3 storage adapter
- [ ] Azure Blob Storage adapter
- [ ] Cloudflare R2 adapter
- [ ] Automatic storage backend failover
- [ ] Cross-backend file migration tools
- [ ] Storage usage analytics dashboard

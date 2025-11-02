// Storage Adapter System
// Supports multiple storage backends: local, NAS, Google Drive

import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';

/**
 * Stored file metadata
 */
export type StoredFile = {
  path: string; // Logical path (batchId/fileName)
  url: string; // Public-accessible URL
  size: number;
  storedAt: Date;
  backend: 'local' | 'nas' | 'google-drive';
};

/**
 * Storage adapter interface
 * All storage backends must implement this interface
 */
export interface StorageAdapter {
  /**
   * Saves a file to storage
   * @param relativePath - Relative path within storage (e.g., "batch123/video_V1.mp4")
   * @param data - File data as Buffer
   * @returns Stored file metadata with public URL
   */
  saveFile(relativePath: string, data: Buffer): Promise<StoredFile>;

  /**
   * Gets public URL for a file
   * @param relativePath - Relative path within storage
   * @returns Public-accessible URL
   */
  getFileUrl(relativePath: string): string;

  /**
   * Checks if file exists
   * @param relativePath - Relative path within storage
   */
  fileExists(relativePath: string): Promise<boolean>;

  /**
   * Deletes a file
   * @param relativePath - Relative path within storage
   */
  deleteFile(relativePath: string): Promise<void>;

  /**
   * Lists files in a directory
   * @param directory - Directory path
   * @returns Array of file paths
   */
  listFiles(directory: string): Promise<string[]>;
}

/**
 * Local filesystem storage adapter
 * Stores files in ./public/generated-videos (default)
 */
export class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;
  private baseUrl: string;

  constructor(basePath?: string, baseUrl?: string) {
    this.basePath = basePath || path.join(process.cwd(), 'public', 'generated-videos');
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  async saveFile(relativePath: string, data: Buffer): Promise<StoredFile> {
    const fullPath = path.join(this.basePath, relativePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file
    await fs.writeFile(fullPath, data);

    console.log(`[Local Storage] Saved file to ${fullPath}`);

    return {
      path: relativePath,
      url: this.getFileUrl(relativePath),
      size: data.length,
      storedAt: new Date(),
      backend: 'local',
    };
  }

  getFileUrl(relativePath: string): string {
    // Public URL: /generated-videos/{relativePath}
    return `${this.baseUrl}/generated-videos/${relativePath}`;
  }

  async fileExists(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, relativePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, relativePath);
    await fs.unlink(fullPath);
    console.log(`[Local Storage] Deleted file: ${fullPath}`);
  }

  async listFiles(directory: string): Promise<string[]> {
    try {
      const fullPath = path.join(this.basePath, directory);
      const files = await fs.readdir(fullPath);
      return files;
    } catch (error) {
      // Directory doesn't exist
      return [];
    }
  }
}

/**
 * NAS (Network Attached Storage) adapter
 * Stores files on mounted NAS volume
 */
export class NASStorageAdapter implements StorageAdapter {
  private nasPath: string;
  private baseUrl: string;

  constructor(nasPath?: string, baseUrl?: string) {
    // Default NAS path from environment or /Volumes/TeamShare/generated-videos
    this.nasPath = nasPath || process.env.NAS_MOUNT_PATH || '/Volumes/TeamShare/generated-videos';
    this.baseUrl = baseUrl || process.env.NAS_PUBLIC_URL || 'http://nas.local/generated-videos';
  }

  async saveFile(relativePath: string, data: Buffer): Promise<StoredFile> {
    const fullPath = path.join(this.nasPath, relativePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file
    await fs.writeFile(fullPath, data);

    console.log(`[NAS Storage] Saved file to ${fullPath}`);

    return {
      path: relativePath,
      url: this.getFileUrl(relativePath),
      size: data.length,
      storedAt: new Date(),
      backend: 'nas',
    };
  }

  getFileUrl(relativePath: string): string {
    // NAS public URL (if NAS has HTTP server)
    return `${this.baseUrl}/${relativePath}`;
  }

  async fileExists(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.nasPath, relativePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.nasPath, relativePath);
    await fs.unlink(fullPath);
    console.log(`[NAS Storage] Deleted file: ${fullPath}`);
  }

  async listFiles(directory: string): Promise<string[]> {
    try {
      const fullPath = path.join(this.nasPath, directory);
      const files = await fs.readdir(fullPath);
      return files;
    } catch (error) {
      return [];
    }
  }
}

/**
 * Google Drive storage adapter
 * Stores files in Google Drive using Drive API v3
 */
export class GoogleDriveStorageAdapter implements StorageAdapter {
  private drive: any;
  private folderId: string;
  private folderCache: Map<string, string> = new Map(); // Cache folder IDs

  constructor(credentials?: any, folderId?: string) {
    // Initialize Google Drive API client
    const auth = new google.auth.GoogleAuth({
      credentials: credentials || JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    this.drive = google.drive({ version: 'v3', auth });
    this.folderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';
  }

  async saveFile(relativePath: string, data: Buffer): Promise<StoredFile> {
    console.log(`[Google Drive Storage] Uploading file: ${relativePath}`);

    // Parse path to get folder structure and filename
    const pathParts = relativePath.split('/');
    const fileName = pathParts.pop()!;
    const folderPath = pathParts.join('/');

    // Create folder structure if needed
    const parentFolderId = await this.ensureFolderExists(folderPath);

    // Upload file
    const response = await this.drive.files.create({
      requestBody: {
        name: fileName,
        parents: [parentFolderId],
        mimeType: this.getMimeType(fileName),
      },
      media: {
        mimeType: this.getMimeType(fileName),
        body: Buffer.from(data),
      },
      fields: 'id,webViewLink,webContentLink',
    });

    // Make file publicly accessible (optional - configure based on needs)
    await this.drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log(`[Google Drive Storage] Uploaded file: ${response.data.id}`);

    return {
      path: relativePath,
      url: response.data.webContentLink || response.data.webViewLink,
      size: data.length,
      storedAt: new Date(),
      backend: 'google-drive',
    };
  }

  getFileUrl(relativePath: string): string {
    // For Google Drive, we need to query to get the actual URL
    // This is a placeholder - actual URL is obtained during saveFile
    return `https://drive.google.com/file/${relativePath}`;
  }

  async fileExists(relativePath: string): Promise<boolean> {
    try {
      const fileId = await this.findFileByPath(relativePath);
      return fileId !== null;
    } catch {
      return false;
    }
  }

  async deleteFile(relativePath: string): Promise<void> {
    const fileId = await this.findFileByPath(relativePath);
    if (fileId) {
      await this.drive.files.delete({ fileId });
      console.log(`[Google Drive Storage] Deleted file: ${fileId}`);
    }
  }

  async listFiles(directory: string): Promise<string[]> {
    try {
      const folderId = await this.findFolderByPath(directory);
      if (!folderId) return [];

      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
      });

      return response.data.files.map((file: any) => file.name);
    } catch {
      return [];
    }
  }

  /**
   * Ensures folder structure exists, creating folders as needed
   */
  private async ensureFolderExists(folderPath: string): Promise<string> {
    if (!folderPath) return this.folderId;

    // Check cache
    if (this.folderCache.has(folderPath)) {
      return this.folderCache.get(folderPath)!;
    }

    const folders = folderPath.split('/').filter(f => f);
    let currentParent = this.folderId;

    for (const folderName of folders) {
      // Search for folder
      const response = await this.drive.files.list({
        q: `name='${folderName}' and '${currentParent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
      });

      if (response.data.files.length > 0) {
        // Folder exists
        currentParent = response.data.files[0].id;
      } else {
        // Create folder
        const createResponse = await this.drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [currentParent],
          },
          fields: 'id',
        });
        currentParent = createResponse.data.id;
      }
    }

    // Cache result
    this.folderCache.set(folderPath, currentParent);

    return currentParent;
  }

  /**
   * Finds file ID by full path
   */
  private async findFileByPath(relativePath: string): Promise<string | null> {
    const pathParts = relativePath.split('/');
    const fileName = pathParts.pop()!;
    const folderPath = pathParts.join('/');

    const parentFolderId = await this.findFolderByPath(folderPath);
    if (!parentFolderId) return null;

    const response = await this.drive.files.list({
      q: `name='${fileName}' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id)',
    });

    return response.data.files.length > 0 ? response.data.files[0].id : null;
  }

  /**
   * Finds folder ID by full path
   */
  private async findFolderByPath(folderPath: string): Promise<string | null> {
    if (!folderPath) return this.folderId;

    // Check cache
    if (this.folderCache.has(folderPath)) {
      return this.folderCache.get(folderPath)!;
    }

    const folders = folderPath.split('/').filter(f => f);
    let currentParent = this.folderId;

    for (const folderName of folders) {
      const response = await this.drive.files.list({
        q: `name='${folderName}' and '${currentParent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
      });

      if (response.data.files.length === 0) {
        return null; // Folder doesn't exist
      }

      currentParent = response.data.files[0].id;
    }

    // Cache result
    this.folderCache.set(folderPath, currentParent);

    return currentParent;
  }

  /**
   * Gets MIME type from filename
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

/**
 * Storage adapter factory
 * Creates the appropriate storage adapter based on configuration
 */
export function createStorageAdapter(): StorageAdapter {
  const storageBackend = process.env.STORAGE_BACKEND || 'local';

  switch (storageBackend) {
    case 'nas':
      console.log('[Storage] Using NAS storage adapter');
      return new NASStorageAdapter();

    case 'google-drive':
      console.log('[Storage] Using Google Drive storage adapter');
      return new GoogleDriveStorageAdapter();

    case 'local':
    default:
      console.log('[Storage] Using local storage adapter');
      return new LocalStorageAdapter();
  }
}

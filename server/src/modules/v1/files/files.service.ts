import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { V1Files } from '@shared/index';

@Injectable()
export class V1FilesService {
  private readonly storageDir = this.getStorageDir();

  private getStorageDir(): string {
    if (process.env.NODE_ENV === 'production') {
      // CLI环境：使用当前工作目录
      return process.cwd();
    } else {
      // 开发环境：必须设置 STORAGE_DIR 环境变量
      if (!process.env.STORAGE_DIR) {
        throw new Error('STORAGE_DIR environment variable must be set in development mode');
      }
      return process.env.STORAGE_DIR;
    }
  }

  // MIME type mapping similar to GitLab
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.xml': 'application/xml',
      '.csv': 'text/csv',
      '.yaml': 'application/x-yaml',
      '.yml': 'application/x-yaml',
      '.log': 'text/plain',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Check if file path is safe (prevent directory traversal)
  private isSafePath(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    return !normalizedPath.includes('../') && !path.isAbsolute(normalizedPath);
  }

  // Check if file is binary
  private isBinaryFile(filePath: string): boolean {
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.exe', '.bin'];
    const ext = path.extname(filePath).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  async getBlobMetadata(filePath: string): Promise<V1Files.BlobInfo> {
    // Security check: prevent directory traversal
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    // Construct full file path
    const fullPath = path.join(this.storageDir, filePath);
    
    // Check if file exists and get stats
    let fileStats;
    try {
      fileStats = await fs.stat(fullPath);
    } catch (error) {
      throw new Error(`File '${filePath}' does not exist`);
    }

    // Check if it's a file (not directory)
    if (!fileStats.isFile()) {
      throw new Error(`Path '${filePath}' is not a file`);
    }

    const mimeType = this.getMimeType(filePath);
    const isBinary = this.isBinaryFile(filePath);
    
    // Determine encoding based on file type (for blob info, we don't include content)
    const encoding: 'text' | 'base64' = isBinary ? 'base64' : 'text';
    
    // Return blob info without content (optimized for large files)
    return {
      file_name: path.basename(filePath),
      file_path: filePath,
      size: fileStats.size,
      encoding: encoding,
      mime_type: mimeType,
      last_modified: fileStats.mtime
    };
  }

  async getFileMetadata(filePath: string): Promise<V1Files.BlobMetadata> {
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path');
    }

    const fullPath = path.join(this.storageDir, filePath);
    
    try {
      const fileStats = await fs.stat(fullPath);
      
      if (!fileStats.isFile()) {
        throw new Error('Path is not a file');
      }

      const mimeType = this.getMimeType(filePath);
      
      return {
        mimeType,
        size: fileStats.size,
        lastModified: fileStats.mtime
      };
    } catch (error) {
      throw new Error('File not found');
    }
  }

  async getMultipleBlobs(filePaths: string[]): Promise<V1Files.MultipleBlobsResponse> {
    const blobs: V1Files.BlobInfo[] = [];
    const errors: Array<{ file_path: string, error: string, message: string }> = [];
    
    for (const filePath of filePaths) {
      try {
        const blobInfo = await this.getBlobMetadata(filePath);
        blobs.push(blobInfo);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          file_path: filePath,
          error: 'File read error',
          message: errorMessage
        });
      }
    }

    const response: V1Files.MultipleBlobsResponse = {
      blobs,
      total_count: filePaths.length,
      success_count: blobs.length,
      error_count: errors.length
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return response;
  }
}
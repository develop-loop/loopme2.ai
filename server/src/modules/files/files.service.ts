import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { FileInfo, FileMetadata, SaveFileResult, MultipleFilesResponse } from '@shared/types/files';

interface SaveFileOptions {
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
}

@Injectable()
export class FilesService {
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

  async getFile(filePath: string, requestedEncoding?: string): Promise<FileInfo> {
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
    
    // Determine encoding based on request and file type
    let encoding: 'text' | 'base64';
    if (requestedEncoding === 'text') {
      encoding = 'text';
    } else if (requestedEncoding === 'base64') {
      encoding = 'base64';
    } else {
      // Auto-detect: use text for text files, base64 for binary
      encoding = isBinary ? 'base64' : 'text';
    }
    
    // For binary files requested as text, throw error
    if (isBinary && encoding === 'text') {
      throw new Error(`File '${filePath}' is a binary file and cannot be encoded as text. Use base64 encoding instead.`);
    }

    // Read file content
    const content = encoding === 'text' 
      ? await fs.readFile(fullPath, 'utf8')
      : await fs.readFile(fullPath);
    
    // Return GitLab-style response format
    return {
      file_name: path.basename(filePath),
      file_path: filePath,
      size: fileStats.size,
      encoding: encoding,
      content_sha256: null, // Could implement SHA256 if needed
      ref: 'main', // GitLab-style reference
      blob_id: null, // GitLab-style blob ID
      commit_id: null, // GitLab-style commit ID
      last_commit_id: null, // GitLab-style last commit ID
      content: encoding === 'text' 
        ? content as string
        : Buffer.from(content as Buffer).toString('base64'),
      mime_type: mimeType,
      last_modified: fileStats.mtime
    };
  }

  async getFileMetadata(filePath: string): Promise<FileMetadata> {
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

  async getMultipleFiles(filePaths: string[], requestedEncoding?: string): Promise<MultipleFilesResponse> {
    const files: FileInfo[] = [];
    const errors: Array<{ file_path: string, error: string, message: string }> = [];
    
    for (const filePath of filePaths) {
      try {
        const fileInfo = await this.getFile(filePath, requestedEncoding);
        files.push(fileInfo);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          file_path: filePath,
          error: 'File read error',
          message: errorMessage
        });
      }
    }

    const response: MultipleFilesResponse = {
      files,
      total_count: filePaths.length,
      success_count: files.length,
      error_count: errors.length
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return response;
  }

  async saveFile(
    filePath: string, 
    content: string, 
    encoding: string = 'text',
    options: SaveFileOptions
  ): Promise<SaveFileResult> {
    // Validate file path
    if (!filePath || filePath.includes('..') || path.isAbsolute(filePath)) {
      throw new Error('Invalid file path');
    }

    const fullPath = path.join(this.storageDir, filePath);
    const dirPath = path.dirname(fullPath);

    try {
      // Check if file exists before writing
      let fileExists = false;
      try {
        await fs.stat(fullPath);
        fileExists = true;
      } catch {
        // File doesn't exist, will be created
      }

      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });

      // Process content based on encoding
      let fileContent: string | Buffer;
      if (encoding === 'base64') {
        // Decode base64 content
        fileContent = Buffer.from(content, 'base64');
      } else {
        // Plain text content
        fileContent = content;
      }

      // Write file
      await fs.writeFile(fullPath, fileContent);

      // Get file stats
      const stats = await fs.stat(fullPath);

      // TODO: Implement actual git commit functionality
      // For now, we'll just log the commit information
      console.log(`File ${fileExists ? 'updated' : 'created'}: ${filePath}`);
      console.log(`Commit message: ${options.commitMessage}`);
      if (options.authorName) console.log(`Author: ${options.authorName}`);
      if (options.authorEmail) console.log(`Email: ${options.authorEmail}`);

      return {
        file_path: filePath,
        size: stats.size,
        encoding: encoding,
        last_modified: stats.mtime.toISOString(),
        created: !fileExists
      };

    } catch (error) {
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    // Validate file path
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    const fullPath = path.join(this.storageDir, filePath);

    try {
      // Check if file exists
      await fs.stat(fullPath);
      
      // Delete the file
      await fs.unlink(fullPath);
      
      console.log(`File deleted: ${filePath}`);
      
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`File '${filePath}' does not exist`);
      }
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
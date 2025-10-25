import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { FileInfo, FileMetadata, SaveFileResult, MultipleFilesResponse } from '@shared/types/files';
import { GitUtil } from '../../utils/git.util';

interface SaveFileOptions {
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
}

@Injectable()
export class FilesService {
  private readonly storageDir = this.getStorageDir();
  private readonly gitUtil = new GitUtil(this.storageDir);

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

      // Perform git commit
      try {
        await this.gitUtil.commit({
          commitMessage: options.commitMessage,
          authorName: options.authorName,
          authorEmail: options.authorEmail,
          filePath: filePath
        });
        console.log(`Git commit successful for file: ${filePath}`);
      } catch (error) {
        console.warn(`Git commit failed for file ${filePath}: ${error}`);
        // Don't fail the entire operation if git commit fails
      }

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

  async renameFile(
    oldPath: string,
    newPath: string,
    content: string,
    encoding: string = 'text',
    options: SaveFileOptions
  ): Promise<SaveFileResult> {
    // Validate paths
    if (!this.isSafePath(oldPath) || !this.isSafePath(newPath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    const oldFullPath = path.join(this.storageDir, oldPath);
    const newFullPath = path.join(this.storageDir, newPath);
    const newDirPath = path.dirname(newFullPath);

    try {
      // Check if old file exists
      await fs.stat(oldFullPath);

      // Ensure new directory exists
      await fs.mkdir(newDirPath, { recursive: true });

      // Process content based on encoding
      let fileContent: string | Buffer;
      if (encoding === 'base64') {
        fileContent = Buffer.from(content, 'base64');
      } else {
        fileContent = content;
      }

      // Write new file
      await fs.writeFile(newFullPath, fileContent);

      // Get file stats
      const stats = await fs.stat(newFullPath);

      // Perform git operations for rename
      try {
        // Add the new file and remove the old file
        await this.gitUtil.addFiles(newPath);
        await this.gitUtil.removeFiles(oldPath);
        
        // Commit the rename operation
        await this.gitUtil.commit({
          commitMessage: options.commitMessage,
          authorName: options.authorName,
          authorEmail: options.authorEmail
        });
        
        console.log(`Git commit successful for file rename: ${oldPath} -> ${newPath}`);
      } catch (error) {
        console.warn(`Git commit failed for file rename ${oldPath} -> ${newPath}: ${error}`);
        // If git fails, we still need to clean up the old file
        try {
          await fs.unlink(oldFullPath);
        } catch (cleanupError) {
          console.warn(`Failed to cleanup old file after git error: ${cleanupError}`);
        }
      }

      // Remove the old file from filesystem (this should normally be handled by git rm)
      try {
        await fs.unlink(oldFullPath);
      } catch (error) {
        // File might already be deleted by git rm, which is fine
        console.log(`Old file cleanup: ${error}`);
      }

      return {
        file_path: newPath,
        size: stats.size,
        encoding: encoding,
        last_modified: stats.mtime.toISOString(),
        created: false // This is a rename, not a creation
      };

    } catch (error) {
      throw new Error(`Failed to rename file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      // Perform git commit for file deletion
      try {
        await this.gitUtil.removeFiles(filePath);
        await this.gitUtil.commit({
          commitMessage: `Delete ${filePath}`,
          authorName: 'System',
          authorEmail: 'system@turbome.ai'
        });
        console.log(`Git commit successful for file deletion: ${filePath}`);
      } catch (error) {
        console.warn(`Git commit failed for file deletion ${filePath}: ${error}`);
        // Don't fail the entire operation if git commit fails
      }
      
      console.log(`File deleted: ${filePath}`);
      
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`File '${filePath}' does not exist`);
      }
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
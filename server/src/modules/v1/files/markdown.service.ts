import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { V1Files } from '@shared/index';
import { FileGitService } from './file-git.service';

interface SaveMarkdownOptions {
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
}

@Injectable()
export class V1MarkdownService {
  private readonly storageDir = this.getStorageDir();

  constructor(private readonly fileGitService: FileGitService) {}

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

  // Check if file path is safe (prevent directory traversal)
  private isSafePath(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    return !normalizedPath.includes('../') && !path.isAbsolute(normalizedPath);
  }

  // Check if file is a markdown file
  private isMarkdownFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ['.md', '.markdown'].includes(ext);
  }

  // Parse frontmatter from markdown content
  private parseFrontmatter(content: string): { frontmatter?: Record<string, any>, content: string } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      return { content };
    }

    try {
      const frontmatterText = match[1];
      const markdownContent = match[2];
      
      // Parse YAML frontmatter manually (simple key-value parsing)
      const frontmatter: Record<string, any> = {};
      const lines = frontmatterText.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;
        
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine.substring(colonIndex + 1).trim();
        
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        // Try to parse as number or boolean
        if (cleanValue === 'true') {
          frontmatter[key] = true;
        } else if (cleanValue === 'false') {
          frontmatter[key] = false;
        } else if (!isNaN(Number(cleanValue)) && cleanValue !== '') {
          frontmatter[key] = Number(cleanValue);
        } else {
          frontmatter[key] = cleanValue;
        }
      }
      
      return { frontmatter, content: markdownContent };
    } catch (error) {
      console.warn(`Failed to parse frontmatter for content: ${error}`);
      return { content };
    }
  }

  async getMarkdownFile(filePath: string): Promise<V1Files.MarkdownInfo> {
    // Security check: prevent directory traversal
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    // Check if it's a markdown file
    if (!this.isMarkdownFile(filePath)) {
      throw new Error(`File '${filePath}' is not a markdown file`);
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

    // Read file content
    let content: string;
    try {
      content = await fs.readFile(fullPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read file '${filePath}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Parse frontmatter
    const { frontmatter, content: markdownContent } = this.parseFrontmatter(content);
    
    // Return markdown info with content and frontmatter
    return {
      file_name: path.basename(filePath),
      file_path: filePath,
      size: fileStats.size,
      last_modified: fileStats.mtime,
      content: markdownContent,
      frontmatter
    };
  }

  async getMultipleMarkdowns(filePaths: string[]): Promise<V1Files.MultipleMarkdownsResponse> {
    const markdowns: V1Files.MarkdownInfo[] = [];
    const errors: Array<{ file_path: string, error: string, message: string }> = [];
    
    for (const filePath of filePaths) {
      try {
        const markdownInfo = await this.getMarkdownFile(filePath);
        markdowns.push(markdownInfo);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          file_path: filePath,
          error: 'Markdown read error',
          message: errorMessage
        });
      }
    }

    const response: V1Files.MultipleMarkdownsResponse = {
      markdowns,
      total_count: filePaths.length,
      success_count: markdowns.length,
      error_count: errors.length
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return response;
  }

  // Combine frontmatter and content into markdown format
  private combineMarkdownContent(content: string, frontmatter?: Record<string, any>): string {
    if (!frontmatter || Object.keys(frontmatter).length === 0) {
      return content;
    }

    // Build YAML frontmatter
    const frontmatterLines = ['---'];
    for (const [key, value] of Object.entries(frontmatter)) {
      if (typeof value === 'string') {
        frontmatterLines.push(`${key}: "${value}"`);
      } else if (typeof value === 'boolean') {
        frontmatterLines.push(`${key}: ${value}`);
      } else if (typeof value === 'number') {
        frontmatterLines.push(`${key}: ${value}`);
      } else {
        // For complex types, convert to string
        frontmatterLines.push(`${key}: "${String(value)}"`);
      }
    }
    frontmatterLines.push('---');

    return frontmatterLines.join('\n') + '\n' + content;
  }

  async updateFrontmatter(
    filePath: string,
    frontmatterUpdates: Record<string, any>,
    options: SaveMarkdownOptions
  ): Promise<V1Files.UpdateFrontmatterResult> {
    // Security check: prevent directory traversal
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    // Check if it's a markdown file
    if (!this.isMarkdownFile(filePath)) {
      throw new Error(`File '${filePath}' is not a markdown file`);
    }

    const fullPath = path.join(this.storageDir, filePath);

    try {
      // Check if file exists
      let fileStats;
      try {
        fileStats = await fs.stat(fullPath);
      } catch (error) {
        throw new Error(`File '${filePath}' does not exist`);
      }

      if (!fileStats.isFile()) {
        throw new Error(`Path '${filePath}' is not a file`);
      }

      // Read current file content
      const currentContent = await fs.readFile(fullPath, 'utf8');
      
      // Parse current frontmatter and content
      const { frontmatter: currentFrontmatter, content: markdownContent } = this.parseFrontmatter(currentContent);

      // Merge frontmatter updates with current frontmatter
      const updatedFrontmatter = { ...currentFrontmatter, ...frontmatterUpdates };
      
      // Get the list of updated keys
      const updatedKeys = Object.keys(frontmatterUpdates);

      // Combine updated frontmatter with content
      const newMarkdownContent = this.combineMarkdownContent(markdownContent, updatedFrontmatter);

      // Write updated file
      await fs.writeFile(fullPath, newMarkdownContent, 'utf8');

      // Get updated file stats
      const newStats = await fs.stat(fullPath);

      // Perform git operations if git repository exists
      try {
        const isGitRepo = await this.fileGitService.isGitRepository();
        if (isGitRepo) {
          await this.fileGitService.addAndCommit([filePath], {
            commitMessage: options.commitMessage,
            authorName: options.authorName,
            authorEmail: options.authorEmail
          });
          console.log(`Git commit successful for frontmatter update: ${filePath}`);
        } else {
          console.log(`Not a git repository, skipping git operations for frontmatter update: ${filePath}`);
        }
      } catch (error) {
        console.warn(`Git operations failed for frontmatter update ${filePath}: ${error}`);
        // Don't fail the entire operation if git commit fails
      }

      return {
        file_path: filePath,
        size: newStats.size,
        last_modified: newStats.mtime.toISOString(),
        updated_keys: updatedKeys,
        current_frontmatter: updatedFrontmatter
      };

    } catch (error) {
      throw new Error(`Failed to update frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFrontmatter(
    filePath: string,
    options: SaveMarkdownOptions,
    frontmatterKeys: string[]
  ): Promise<V1Files.DeleteFrontmatterResult> {
    // Security check: prevent directory traversal
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    // Check if it's a markdown file
    if (!this.isMarkdownFile(filePath)) {
      throw new Error(`File '${filePath}' is not a markdown file`);
    }

    const fullPath = path.join(this.storageDir, filePath);

    try {
      // Check if file exists
      let fileStats;
      try {
        fileStats = await fs.stat(fullPath);
      } catch (error) {
        throw new Error(`File '${filePath}' does not exist`);
      }

      if (!fileStats.isFile()) {
        throw new Error(`Path '${filePath}' is not a file`);
      }

      // Read current file content
      const currentContent = await fs.readFile(fullPath, 'utf8');
      
      // Parse current frontmatter and content
      const { frontmatter: currentFrontmatter, content: markdownContent } = this.parseFrontmatter(currentContent);

      if (!currentFrontmatter || Object.keys(currentFrontmatter).length === 0) {
        throw new Error(`File '${filePath}' has no frontmatter to delete`);
      }

      let updatedFrontmatter = { ...currentFrontmatter };
      let deletedKeys: string[] = [];

      // Check if user wants to delete all frontmatter
      if (frontmatterKeys.length === 1 && frontmatterKeys[0] === '*') {
        // Delete all frontmatter
        deletedKeys = Object.keys(currentFrontmatter);
        updatedFrontmatter = {};
      } else {
        // Delete specific keys
        for (const key of frontmatterKeys) {
          if (key === '*') {
            throw new Error(`Wildcard "*" must be used alone to delete all frontmatter in file '${filePath}'`);
          }
          if (key in updatedFrontmatter) {
            delete updatedFrontmatter[key];
            deletedKeys.push(key);
          }
        }
      }

      if (deletedKeys.length === 0) {
        throw new Error(`No matching frontmatter keys found to delete in file '${filePath}'`);
      }

      // Combine updated frontmatter with content
      const newMarkdownContent = Object.keys(updatedFrontmatter).length > 0 
        ? this.combineMarkdownContent(markdownContent, updatedFrontmatter)
        : markdownContent; // No frontmatter left, just content

      // Write updated file
      await fs.writeFile(fullPath, newMarkdownContent, 'utf8');

      // Get updated file stats
      const newStats = await fs.stat(fullPath);

      // Perform git operations if git repository exists
      try {
        const isGitRepo = await this.fileGitService.isGitRepository();
        if (isGitRepo) {
          await this.fileGitService.addAndCommit([filePath], {
            commitMessage: options.commitMessage,
            authorName: options.authorName,
            authorEmail: options.authorEmail
          });
          console.log(`Git commit successful for frontmatter deletion: ${filePath}`);
        } else {
          console.log(`Not a git repository, skipping git operations for frontmatter deletion: ${filePath}`);
        }
      } catch (error) {
        console.warn(`Git operations failed for frontmatter deletion ${filePath}: ${error}`);
        // Don't fail the entire operation if git commit fails
      }

      return {
        file_path: filePath,
        size: newStats.size,
        last_modified: newStats.mtime.toISOString(),
        deleted_keys: deletedKeys,
        remaining_frontmatter: updatedFrontmatter
      };

    } catch (error) {
      throw new Error(`Failed to delete frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateMultipleFrontmatter(requests: V1Files.UpdateFrontmatterRequest[]): Promise<V1Files.UpdateMultipleFrontmatterResponse> {
    const results: V1Files.UpdateFrontmatterResult[] = [];
    const errors: Array<{ file_path: string; error: string; message: string; }> = [];

    // Process each file
    for (const request of requests) {
      try {
        const { file_path, frontmatter_updates, commit_message, author_name, author_email } = request;

        if (!file_path || !frontmatter_updates || !commit_message) {
          errors.push({
            file_path: file_path || 'unknown',
            error: 'VALIDATION_ERROR',
            message: 'Missing required fields: file_path, frontmatter_updates, commit_message'
          });
          continue;
        }

        if (typeof frontmatter_updates !== 'object' || Array.isArray(frontmatter_updates)) {
          errors.push({
            file_path,
            error: 'VALIDATION_ERROR',
            message: 'frontmatter_updates must be an object with key-value pairs'
          });
          continue;
        }

        const result = await this.updateFrontmatter(file_path, frontmatter_updates, {
          commitMessage: commit_message,
          authorName: author_name,
          authorEmail: author_email
        });

        results.push(result);

      } catch (error) {
        errors.push({
          file_path: request.file_path || 'unknown',
          error: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }

    const total_count = requests.length;
    const success_count = results.length;
    const error_count = errors.length;

    return {
      success: success_count > 0, // 至少有一个文件成功才算成功
      data: {
        results,
        total_count,
        success_count,
        error_count,
        errors: error_count > 0 ? errors : undefined
      },
      message: error_count === 0 
        ? `All ${success_count} frontmatter updates processed successfully`
        : `${success_count} frontmatter updates processed successfully, ${error_count} files failed`
    };
  }

  async deleteMultipleFrontmatter(requests: V1Files.DeleteFrontmatterRequest[]): Promise<V1Files.DeleteMultipleFrontmatterResponse> {
    const results: V1Files.DeleteFrontmatterResult[] = [];
    const errors: Array<{ file_path: string; error: string; message: string; }> = [];

    // Process each file
    for (const request of requests) {
      try {
        const { file_path, frontmatter_keys, commit_message, author_name, author_email } = request;

        if (!file_path || !frontmatter_keys || !commit_message) {
          errors.push({
            file_path: file_path || 'unknown',
            error: 'VALIDATION_ERROR',
            message: 'Missing required fields: file_path, frontmatter_keys, commit_message'
          });
          continue;
        }

        if (!Array.isArray(frontmatter_keys) || frontmatter_keys.length === 0) {
          errors.push({
            file_path,
            error: 'VALIDATION_ERROR',
            message: 'frontmatter_keys must be a non-empty array. Use ["*"] to delete all frontmatter.'
          });
          continue;
        }

        const result = await this.deleteFrontmatter(file_path, {
          commitMessage: commit_message,
          authorName: author_name,
          authorEmail: author_email
        }, frontmatter_keys);

        results.push(result);

      } catch (error) {
        errors.push({
          file_path: request.file_path || 'unknown',
          error: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }

    const total_count = requests.length;
    const success_count = results.length;
    const error_count = errors.length;

    return {
      success: success_count > 0, // 至少有一个文件成功才算成功
      data: {
        results,
        total_count,
        success_count,
        error_count,
        errors: error_count > 0 ? errors : undefined
      },
      message: error_count === 0 
        ? `All ${success_count} frontmatter deletions processed successfully`
        : `${success_count} frontmatter deletions processed successfully, ${error_count} files failed`
    };
  }

  async saveMarkdownFile(
    filePath: string,
    content: string,
    options: SaveMarkdownOptions,
    frontmatter?: Record<string, any>
  ): Promise<V1Files.SaveMarkdownResult> {
    // Security check: prevent directory traversal
    if (!this.isSafePath(filePath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    // Check if it's a markdown file
    if (!this.isMarkdownFile(filePath)) {
      throw new Error(`File '${filePath}' is not a markdown file`);
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

      // Combine frontmatter and content
      const markdownContent = this.combineMarkdownContent(content, frontmatter);

      // Write file
      await fs.writeFile(fullPath, markdownContent, 'utf8');

      // Get file stats
      const stats = await fs.stat(fullPath);

      // Perform git operations if git repository exists
      try {
        const isGitRepo = await this.fileGitService.isGitRepository();
        if (isGitRepo) {
          await this.fileGitService.addAndCommit([filePath], {
            commitMessage: options.commitMessage,
            authorName: options.authorName,
            authorEmail: options.authorEmail
          });
          console.log(`Git commit successful for markdown file: ${filePath}`);
        } else {
          console.log(`Not a git repository, skipping git operations for: ${filePath}`);
        }
      } catch (error) {
        console.warn(`Git operations failed for file ${filePath}: ${error}`);
        // Don't fail the entire operation if git commit fails
      }

      return {
        file_path: filePath,
        size: stats.size,
        last_modified: stats.mtime.toISOString(),
        created: !fileExists
      };

    } catch (error) {
      throw new Error(`Failed to save markdown file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async renameMarkdownFile(
    oldPath: string,
    newPath: string,
    content: string,
    options: SaveMarkdownOptions,
    frontmatter?: Record<string, any>
  ): Promise<V1Files.SaveMarkdownResult> {
    // Validate paths
    if (!this.isSafePath(oldPath) || !this.isSafePath(newPath)) {
      throw new Error('Invalid file path: contains invalid characters or attempts directory traversal');
    }

    // Check if both are markdown files
    if (!this.isMarkdownFile(oldPath) || !this.isMarkdownFile(newPath)) {
      throw new Error('Both old and new paths must be markdown files');
    }

    const oldFullPath = path.join(this.storageDir, oldPath);
    const newFullPath = path.join(this.storageDir, newPath);
    const newDirPath = path.dirname(newFullPath);

    try {
      // Check if old file exists
      await fs.stat(oldFullPath);

      // Ensure new directory exists
      await fs.mkdir(newDirPath, { recursive: true });

      // Combine frontmatter and content
      const markdownContent = this.combineMarkdownContent(content, frontmatter);

      // Write new file
      await fs.writeFile(newFullPath, markdownContent, 'utf8');

      // Get file stats
      const stats = await fs.stat(newFullPath);

      // Perform git operations for rename if git repository exists
      try {
        const isGitRepo = await this.fileGitService.isGitRepository();
        if (isGitRepo) {
          // Add the new file and remove the old file, then commit
          await this.fileGitService.addFiles([newPath]);
          await this.fileGitService.removeFiles([oldPath]);
          await this.fileGitService.commit({
            commitMessage: options.commitMessage,
            authorName: options.authorName,
            authorEmail: options.authorEmail
          });
          console.log(`Git commit successful for markdown file rename: ${oldPath} -> ${newPath}`);
        } else {
          console.log(`Not a git repository, skipping git operations for rename: ${oldPath} -> ${newPath}`);
          // Remove the old file manually if not using git
          try {
            await fs.unlink(oldFullPath);
          } catch (error) {
            console.warn(`Failed to remove old file: ${error}`);
          }
        }
      } catch (error) {
        console.warn(`Git operations failed for file rename ${oldPath} -> ${newPath}: ${error}`);
        // If git fails, we still need to clean up the old file
        try {
          await fs.unlink(oldFullPath);
        } catch (cleanupError) {
          console.warn(`Failed to cleanup old file after git error: ${cleanupError}`);
        }
      }

      return {
        file_path: newPath,
        size: stats.size,
        last_modified: stats.mtime.toISOString(),
        created: false // This is a rename, not a creation
      };

    } catch (error) {
      throw new Error(`Failed to rename markdown file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveMultipleMarkdowns(requests: V1Files.SaveMarkdownRequest[]): Promise<V1Files.SaveMultipleMarkdownsResponse> {
    const results: V1Files.SaveMarkdownResult[] = [];
    const errors: Array<{ file_path: string; error: string; message: string; }> = [];

    // Process each file
    for (const request of requests) {
      try {
        const { file_path, content, commit_message, author_name, author_email, previous_path, frontmatter } = request;

        if (!file_path || !content || !commit_message) {
          errors.push({
            file_path: file_path || 'unknown',
            error: 'VALIDATION_ERROR',
            message: 'Missing required fields: file_path, content, commit_message'
          });
          continue;
        }

        // Handle file rename if previous_path is provided
        if (previous_path && previous_path !== file_path) {
          try {
            const result = await this.renameMarkdownFile(previous_path, file_path, content, {
              commitMessage: commit_message,
              authorName: author_name,
              authorEmail: author_email
            }, frontmatter);

            results.push({
              ...result,
              renamed_from: previous_path,
              operation: 'rename'
            });

          } catch (error) {
            errors.push({
              file_path,
              error: 'RENAME_ERROR',
              message: `Rename operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
        } else {
          // Normal save operation
          const result = await this.saveMarkdownFile(file_path, content, {
            commitMessage: commit_message,
            authorName: author_name,
            authorEmail: author_email
          }, frontmatter);

          results.push(result);
        }

      } catch (error) {
        errors.push({
          file_path: request.file_path || 'unknown',
          error: 'SAVE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }

    const total_count = requests.length;
    const success_count = results.length;
    const error_count = errors.length;

    return {
      success: success_count > 0, // 至少有一个文件成功才算成功
      data: {
        results,
        total_count,
        success_count,
        error_count,
        errors: error_count > 0 ? errors : undefined
      },
      message: error_count === 0 
        ? `All ${success_count} markdown files processed successfully`
        : `${success_count} markdown files processed successfully, ${error_count} files failed`
    };
  }
}
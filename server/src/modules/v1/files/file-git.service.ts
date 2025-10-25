import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface GitCommitOptions {
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
  filePaths?: string[];
}

@Injectable()
export class FileGitService {
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

  async addFiles(filePaths: string[]): Promise<void> {
    if (!filePaths || filePaths.length === 0) {
      return;
    }

    try {
      // Add specific files to git
      const quotedPaths = filePaths.map(path => `"${path}"`).join(' ');
      const addCommand = `git add ${quotedPaths}`;
      
      await execAsync(addCommand, { 
        cwd: this.storageDir,
        timeout: 10000 
      });
      
      console.log(`Git add successful for files: ${filePaths.join(', ')}`);
    } catch (error) {
      console.warn(`Git add failed for files ${filePaths.join(', ')}: ${error}`);
      throw new Error(`Failed to add files to git: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeFiles(filePaths: string[]): Promise<void> {
    if (!filePaths || filePaths.length === 0) {
      return;
    }

    try {
      // Remove specific files from git
      const quotedPaths = filePaths.map(path => `"${path}"`).join(' ');
      const removeCommand = `git rm ${quotedPaths}`;
      
      await execAsync(removeCommand, { 
        cwd: this.storageDir,
        timeout: 10000 
      });
      
      console.log(`Git remove successful for files: ${filePaths.join(', ')}`);
    } catch (error) {
      console.warn(`Git remove failed for files ${filePaths.join(', ')}: ${error}`);
      throw new Error(`Failed to remove files from git: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async commit(options: GitCommitOptions): Promise<void> {
    const { commitMessage, authorName, authorEmail, filePaths } = options;

    try {
      // If specific files are provided, add them first
      if (filePaths && filePaths.length > 0) {
        await this.addFiles(filePaths);
      }

      // Build commit command with proper argument order
      let commitCommand = 'git commit';
      
      // Add author information if provided
      if (authorName && authorEmail) {
        commitCommand += ` --author="${authorName} <${authorEmail}>"`;
      } else if (authorName) {
        commitCommand += ` --author="${authorName} <unknown@example.com>"`;
      }
      
      // Add commit message (properly escaped) - must come after other options
      commitCommand += ` -m "${commitMessage.replace(/"/g, '\\"')}"`;
      
      await execAsync(commitCommand, { 
        cwd: this.storageDir,
        timeout: 15000 
      });
      
      console.log(`Git commit successful: ${commitMessage}`);
    } catch (error) {
      console.warn(`Git commit failed: ${error}`);
      throw new Error(`Failed to commit to git: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addAndCommit(filePaths: string[], options: Omit<GitCommitOptions, 'filePaths'>): Promise<void> {
    try {
      // Add files first
      await this.addFiles(filePaths);
      
      // Then commit
      await this.commit({
        ...options,
        filePaths: [] // Don't add again in commit
      });
      
      console.log(`Git add and commit successful for files: ${filePaths.join(', ')}`);
    } catch (error) {
      console.warn(`Git add and commit failed for files ${filePaths.join(', ')}: ${error}`);
      throw new Error(`Failed to add and commit files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeAndCommit(filePaths: string[], options: Omit<GitCommitOptions, 'filePaths'>): Promise<void> {
    try {
      // Remove files first
      await this.removeFiles(filePaths);
      
      // Then commit
      await this.commit({
        ...options,
        filePaths: [] // Don't add again in commit
      });
      
      console.log(`Git remove and commit successful for files: ${filePaths.join(', ')}`);
    } catch (error) {
      console.warn(`Git remove and commit failed for files ${filePaths.join(', ')}: ${error}`);
      throw new Error(`Failed to remove and commit files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { 
        cwd: this.storageDir,
        timeout: 5000 
      });
      return true;
    } catch {
      return false;
    }
  }
}
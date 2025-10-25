import { Injectable } from '@nestjs/common';
import { GitUtil } from '../../utils/git.util';

export interface GitConfigResponse {
  success: boolean;
  data?: { [key: string]: string };
  message?: string;
}

@Injectable()
export class GitService {
  private readonly gitUtil: GitUtil;
  private readonly storageDir = this.getStorageDir();

  constructor() {
    this.gitUtil = new GitUtil(this.storageDir);
  }

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

  async getGitConfig(): Promise<GitConfigResponse> {
    try {
      const isRepo = await this.gitUtil.isGitRepository();
      if (!isRepo) {
        return {
          success: false,
          message: 'Not a git repository'
        };
      }

      const config = await this.gitUtil.getGitConfig();
      return {
        success: true,
        data: config
      };

    } catch (error) {
      console.error('Error getting git config:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get git config'
      };
    }
  }
}
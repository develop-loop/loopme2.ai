import { Injectable } from '@nestjs/common';
import { GitUtil } from '../../../utils/git.util';
import { V1Git } from '@shared/index';

@Injectable()
export class V1GitService {
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

  async getCommits(query: V1Git.GitCommitsQuery): Promise<V1Git.GitCommitsResponse> {
    try {
      // Check if it's a git repository
      const isRepo = await this.gitUtil.isGitRepository();
      if (!isRepo) {
        return {
          success: false,
          data: {
            commits: [],
            total_count: 0,
            page: query.page || 1,
            per_page: query.per_page || 20,
            has_next_page: false,
            has_prev_page: false
          },
          message: 'Not a git repository'
        };
      }

      const page = query.page || 1;
      const per_page = Math.min(query.per_page || 20, 100); // Limit to 100 per page

      // Get commits from git
      const result = await this.gitUtil.getCommits({
        ...query,
        page,
        per_page
      });

      const total_pages = Math.ceil(result.totalCount / per_page);
      const has_next_page = page < total_pages;
      const has_prev_page = page > 1;

      return {
        success: true,
        data: {
          commits: result.commits,
          total_count: result.totalCount,
          page,
          per_page,
          has_next_page,
          has_prev_page
        }
      };

    } catch (error) {
      console.error('Error getting commits:', error);
      return {
        success: false,
        data: {
          commits: [],
          total_count: 0,
          page: query.page || 1,
          per_page: query.per_page || 20,
          has_next_page: false,
          has_prev_page: false
        },
        message: error instanceof Error ? error.message : 'Failed to get commits'
      };
    }
  }

  async getGitConfig(): Promise<V1Git.GitConfigResponse> {
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
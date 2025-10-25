import { V1Files } from '@shared/index';
import { BaseApiService } from './BaseApiService';

/**
 * V1 Files Service - 处理所有V1文件相关的API调用
 * 使用shared V1Files types确保前后端类型一致性
 */
export class V1FilesService extends BaseApiService {
  constructor(baseUrl: string = '/api/v1') {
    super(baseUrl);
  }

  /**
   * 获取文件blob元数据（不包含内容，适合大文件）
   */
  async getBlobs(request: V1Files.GetBlobsRequest): Promise<V1Files.GetBlobsResponse> {
    try {
      const params: Record<string, string | string[]> = {
        file_paths: request.file_paths,
      };

      return await this.get<V1Files.GetBlobsResponse>('files/blob', params);
    } catch (error) {
      console.error('V1FilesService.getBlobs error:', error);
      throw error;
    }
  }

  /**
   * 获取markdown文件内容和frontmatter
   */
  async getMarkdowns(request: V1Files.GetMarkdownsRequest): Promise<V1Files.GetMarkdownsResponse> {
    try {
      const params: Record<string, string | string[]> = {
        file_paths: request.file_paths,
      };

      return await this.get<V1Files.GetMarkdownsResponse>('files/markdown', params);
    } catch (error) {
      console.error('V1FilesService.getMarkdowns error:', error);
      throw error;
    }
  }

  /**
   * 保存多个markdown文件
   */
  async saveMarkdowns(request: V1Files.SaveMultipleMarkdownsRequest): Promise<V1Files.SaveMultipleMarkdownsResponse> {
    try {
      return await this.put<V1Files.SaveMultipleMarkdownsResponse>('files/markdown', request);
    } catch (error) {
      console.error('V1FilesService.saveMarkdowns error:', error);
      throw error;
    }
  }

  /**
   * 保存单个markdown文件（向后兼容）
   */
  async saveMarkdown(request: V1Files.SaveMarkdownRequest): Promise<V1Files.SaveMarkdownResponse> {
    try {
      // 使用批量保存API保存单个文件
      const multipleResponse = await this.saveMarkdowns({
        files: [request]
      });
      
      if (multipleResponse.success && multipleResponse.data.results.length > 0) {
        return {
          success: true,
          data: multipleResponse.data.results[0],
          message: multipleResponse.message
        };
      } else {
        throw new Error(multipleResponse.data.errors?.[0]?.message || 'Failed to save markdown file');
      }
    } catch (error) {
      console.error('V1FilesService.saveMarkdown error:', error);
      throw error;
    }
  }

  /**
   * 更新多个markdown文件的frontmatter
   */
  async updateFrontmatter(request: V1Files.UpdateMultipleFrontmatterRequest): Promise<V1Files.UpdateMultipleFrontmatterResponse> {
    try {
      return await this.put<V1Files.UpdateMultipleFrontmatterResponse>('files/markdown/frontmatter', request);
    } catch (error) {
      console.error('V1FilesService.updateFrontmatter error:', error);
      throw error;
    }
  }

  /**
   * 更新单个markdown文件的frontmatter（向后兼容）
   */
  async updateSingleFrontmatter(request: V1Files.UpdateFrontmatterRequest): Promise<V1Files.UpdateFrontmatterResponse> {
    try {
      // 使用批量更新API更新单个文件
      const multipleResponse = await this.updateFrontmatter({
        files: [request]
      });
      
      if (multipleResponse.success && multipleResponse.data.results.length > 0) {
        return {
          success: true,
          data: multipleResponse.data.results[0],
          message: multipleResponse.message
        };
      } else {
        throw new Error(multipleResponse.data.errors?.[0]?.message || 'Failed to update frontmatter');
      }
    } catch (error) {
      console.error('V1FilesService.updateSingleFrontmatter error:', error);
      throw error;
    }
  }

  /**
   * 获取单个文件blob元数据
   */
  async getBlob(filePath: string): Promise<V1Files.GetBlobsResponse> {
    return this.getBlobs({
      file_paths: [filePath]
    });
  }

  /**
   * 获取单个markdown文件
   */
  async getMarkdown(filePath: string): Promise<V1Files.GetMarkdownsResponse> {
    return this.getMarkdowns({
      file_paths: [filePath]
    });
  }

  /**
   * 检查文件是否存在（使用blob接口）
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const response = await this.getBlob(filePath);
      return response.success && response.data.success_count > 0;
    } catch {
      return false;
    }
  }

  /**
   * 检查多个文件是否存在
   */
  async filesExist(filePaths: string[]): Promise<Record<string, boolean>> {
    try {
      const response = await this.getBlobs({ file_paths: filePaths });
      
      const result: Record<string, boolean> = {};
      
      // 标记所有请求的文件为不存在
      filePaths.forEach(path => {
        result[path] = false;
      });
      
      // 标记实际存在的文件
      if (response.success && response.data.blobs) {
        response.data.blobs.forEach(blob => {
          result[blob.file_path] = true;
        });
      }
      
      return result;
    } catch {
      // 如果出错，返回所有文件都不存在
      const result: Record<string, boolean> = {};
      filePaths.forEach(path => {
        result[path] = false;
      });
      return result;
    }
  }

  /**
   * 保存markdown文件并自动添加workspace到frontmatter
   */
  async saveMarkdownWithWorkspace(
    filePath: string,
    content: string,
    workspace: string,
    commitMessage: string,
    authorName?: string,
    authorEmail?: string,
    additionalFrontmatter?: Record<string, unknown>
  ): Promise<V1Files.SaveMarkdownResponse> {
    const frontmatter = {
      workspace,
      ...additionalFrontmatter
    };

    return this.saveMarkdown({
      file_path: filePath,
      content,
      commit_message: commitMessage,
      author_name: authorName,
      author_email: authorEmail,
      frontmatter
    });
  }

  /**
   * 重命名markdown文件并保持workspace信息
   */
  async renameMarkdownWithWorkspace(
    oldPath: string,
    newPath: string,
    content: string,
    workspace: string,
    commitMessage: string,
    authorName?: string,
    authorEmail?: string,
    additionalFrontmatter?: Record<string, unknown>
  ): Promise<V1Files.SaveMarkdownResponse> {
    const frontmatter = {
      workspace,
      ...additionalFrontmatter
    };

    return this.saveMarkdown({
      file_path: newPath,
      content,
      commit_message: commitMessage,
      author_name: authorName,
      author_email: authorEmail,
      previous_path: oldPath,
      frontmatter
    });
  }

  /**
   * 删除多个markdown文件的frontmatter
   */
  async deleteFrontmatter(request: V1Files.DeleteMultipleFrontmatterRequest): Promise<V1Files.DeleteMultipleFrontmatterResponse> {
    try {
      return await this.delete<V1Files.DeleteMultipleFrontmatterResponse>('files/markdown/frontmatter', request);
    } catch (error) {
      console.error('V1FilesService.deleteFrontmatter error:', error);
      throw error;
    }
  }

  /**
   * 删除单个markdown文件的frontmatter（向后兼容）
   */
  async deleteSingleFrontmatter(request: V1Files.DeleteFrontmatterRequest): Promise<V1Files.DeleteFrontmatterResponse> {
    try {
      // 使用批量删除API删除单个文件
      const multipleResponse = await this.deleteFrontmatter({
        files: [request]
      });
      
      if (multipleResponse.success && multipleResponse.data.results.length > 0) {
        return {
          success: true,
          data: multipleResponse.data.results[0],
          message: multipleResponse.message
        };
      } else {
        throw new Error(multipleResponse.data.errors?.[0]?.message || 'Failed to delete frontmatter');
      }
    } catch (error) {
      console.error('V1FilesService.deleteSingleFrontmatter error:', error);
      throw error;
    }
  }

  /**
   * 更新文件的workspace信息
   */
  async updateWorkspace(
    filePath: string,
    workspace: string,
    commitMessage: string = `Update workspace to ${workspace}`,
    authorName?: string,
    authorEmail?: string
  ): Promise<V1Files.UpdateFrontmatterResponse> {
    return this.updateSingleFrontmatter({
      file_path: filePath,
      frontmatter_updates: { workspace },
      commit_message: commitMessage,
      author_name: authorName,
      author_email: authorEmail
    });
  }

  /**
   * 删除文件的特定frontmatter字段
   */
  async deleteFrontmatterKeys(
    filePath: string,
    keys: string[],
    commitMessage: string,
    authorName?: string,
    authorEmail?: string
  ): Promise<V1Files.DeleteFrontmatterResponse> {
    return this.deleteSingleFrontmatter({
      file_path: filePath,
      frontmatter_keys: keys,
      commit_message: commitMessage,
      author_name: authorName,
      author_email: authorEmail
    });
  }

  /**
   * 删除文件的所有frontmatter
   */
  async deleteAllFrontmatter(
    filePath: string,
    commitMessage: string,
    authorName?: string,
    authorEmail?: string
  ): Promise<V1Files.DeleteFrontmatterResponse> {
    return this.deleteSingleFrontmatter({
      file_path: filePath,
      frontmatter_keys: ['*'],
      commit_message: commitMessage,
      author_name: authorName,
      author_email: authorEmail
    });
  }
}

// 创建默认实例
export const v1FilesService = new V1FilesService();
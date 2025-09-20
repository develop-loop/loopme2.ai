import { 
  GetFilesRequest, 
  GetFilesResponse, 
  SaveFileRequest, 
  SaveFileResponse, 
  SaveMultipleFilesRequest,
  SaveMultipleFilesResponse,
  DeleteFileResponse,
  DeleteMultipleFilesResponse 
} from '@shared/types/files';
import { BaseApiService } from './BaseApiService';

/**
 * Files Service - 处理所有文件相关的API调用
 * 使用shared types确保前后端类型一致性
 */
export class FilesService extends BaseApiService {
  constructor(baseUrl: string = '/api') {
    super(baseUrl);
  }

  /**
   * 获取文件内容
   */
  async getFiles(request: GetFilesRequest): Promise<GetFilesResponse> {
    try {
      const params: Record<string, string | string[] | boolean | undefined> = {
        file_paths: request.file_paths,
      };
      
      if (request.encoding) {
        params.encoding = request.encoding;
      }
      
      if (request.metadata_only) {
        params.metadata_only = true;
      }

      return await this.get<GetFilesResponse>('files', params);
    } catch (error) {
      console.error('FilesService.getFiles error:', error);
      throw error;
    }
  }

  /**
   * 保存单个文件 (向后兼容)
   */
  async saveFile(request: SaveFileRequest): Promise<SaveFileResponse> {
    try {
      // 使用新的批量保存API保存单个文件
      const multipleResponse = await this.saveMultipleFiles({
        files: [request]
      });
      
      if (multipleResponse.success && multipleResponse.data.results.length > 0) {
        return {
          success: true,
          data: multipleResponse.data.results[0],
          message: multipleResponse.message
        };
      } else {
        throw new Error(multipleResponse.data.errors?.[0]?.message || 'Failed to save file');
      }
    } catch (error) {
      console.error('FilesService.saveFile error:', error);
      throw error;
    }
  }

  /**
   * 批量保存文件
   */
  async saveMultipleFiles(request: SaveMultipleFilesRequest): Promise<SaveMultipleFilesResponse> {
    try {
      return await this.put<SaveMultipleFilesResponse>('files', request);
    } catch (error) {
      console.error('FilesService.saveMultipleFiles error:', error);
      throw error;
    }
  }

  /**
   * 删除单个文件 (向后兼容)
   */
  async deleteFile(filePath: string): Promise<DeleteFileResponse> {
    try {
      // 使用新的批量删除API删除单个文件
      const multipleResponse = await this.deleteMultipleFiles([filePath]);
      
      if (multipleResponse.success && multipleResponse.data.results.length > 0) {
        return {
          success: true,
          message: multipleResponse.message
        };
      } else {
        throw new Error(multipleResponse.data.errors?.[0]?.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('FilesService.deleteFile error:', error);
      throw error;
    }
  }

  /**
   * 批量删除文件
   */
  async deleteMultipleFiles(filePaths: string[]): Promise<DeleteMultipleFilesResponse> {
    try {
      return await this.delete<DeleteMultipleFilesResponse>('files', { file_paths: filePaths });
    } catch (error) {
      console.error('FilesService.deleteMultipleFiles error:', error);
      throw error;
    }
  }

  /**
   * 检查单个文件是否存在
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const response = await this.getFiles({ 
        file_paths: [filePath], 
        metadata_only: true 
      });
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
      const response = await this.getFiles({ 
        file_paths: filePaths, 
        metadata_only: true 
      });
      
      const result: Record<string, boolean> = {};
      
      // 标记所有请求的文件为不存在
      filePaths.forEach(path => {
        result[path] = false;
      });
      
      // 标记实际存在的文件
      if (response.success && response.data.files) {
        response.data.files.forEach(file => {
          result[file.file_path] = true;
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
   * 批量获取文件
   */
  async getMultipleFiles(filePaths: string[], encoding?: 'auto' | 'text' | 'base64'): Promise<GetFilesResponse> {
    return this.getFiles({
      file_paths: filePaths,
      encoding,
      metadata_only: false
    });
  }

  /**
   * 获取单个文件元数据
   */
  async getFileMetadata(filePath: string): Promise<GetFilesResponse> {
    return this.getFiles({
      file_paths: [filePath],
      metadata_only: true
    });
  }

  /**
   * 批量获取文件元数据
   */
  async getMultipleFileMetadata(filePaths: string[]): Promise<GetFilesResponse> {
    return this.getFiles({
      file_paths: filePaths,
      metadata_only: true
    });
  }

  /**
   * 获取单个文件内容
   */
  async getFile(filePath: string, encoding?: 'auto' | 'text' | 'base64'): Promise<GetFilesResponse> {
    return this.getFiles({
      file_paths: [filePath],
      encoding,
      metadata_only: false
    });
  }
}

// 创建默认实例
export const filesService = new FilesService();
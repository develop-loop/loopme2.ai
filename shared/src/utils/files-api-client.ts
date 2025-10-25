import { GetFilesRequest, GetFilesResponse, SaveFileRequest, SaveFileResponse, DeleteFileRequest, DeleteFileResponse, DeleteMultipleFilesResponse, SaveMultipleFilesRequest, SaveMultipleFilesResponse } from '../types/files';

export class FilesApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * 获取文件内容
   */
  async getFiles(request: GetFilesRequest): Promise<GetFilesResponse> {
    const params = new URLSearchParams();
    params.append('file_paths', JSON.stringify(request.file_paths));
    
    if (request.encoding) {
      params.append('encoding', request.encoding);
    }
    
    if (request.metadata_only) {
      params.append('metadata_only', 'true');
    }

    const response = await fetch(`${this.baseUrl}/files?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get files: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * 获取单个文件内容
   */
  async getFile(filePath: string, encoding?: string): Promise<GetFilesResponse> {
    return this.getFiles({
      file_paths: [filePath],
      encoding: encoding as any,
    });
  }

  /**
   * 保存单个文件 (向后兼容)
   */
  async saveFile(request: SaveFileRequest): Promise<SaveFileResponse> {
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
  }

  /**
   * 批量保存文件
   */
  async saveMultipleFiles(request: SaveMultipleFilesRequest): Promise<SaveMultipleFilesResponse> {
    const response = await fetch(`${this.baseUrl}/files`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to save files: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 删除单个文件 (向后兼容)
   */
  async deleteFile(filePath: string): Promise<DeleteFileResponse> {
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
  }

  /**
   * 批量删除文件
   */
  async deleteMultipleFiles(filePaths: string[]): Promise<DeleteMultipleFilesResponse> {
    const params = new URLSearchParams();
    params.append('file_paths', JSON.stringify(filePaths));

    const response = await fetch(`${this.baseUrl}/files?${params.toString()}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete files: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 获取文件元数据
   */
  async getFileMetadata(filePath: string): Promise<Response> {
    return this.getFiles({
      file_paths: [filePath],
      metadata_only: true,
    }) as any; // 元数据返回的是Response headers
  }
}
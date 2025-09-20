import { GetFilesRequest, GetFilesResponse, SaveFileRequest, SaveFileResponse, DeleteFileRequest, DeleteFileResponse } from '../types/files';

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
   * 保存文件
   */
  async saveFile(request: SaveFileRequest): Promise<SaveFileResponse> {
    const params = new URLSearchParams();
    params.append('file_path', request.file_path);

    const body = {
      content: request.content,
      encoding: request.encoding,
      commit_message: request.commit_message,
      author_name: request.author_name,
      author_email: request.author_email,
      previous_path: request.previous_path,
    };

    const response = await fetch(`${this.baseUrl}/files?${params.toString()}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to save file: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 删除文件
   */
  async deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse> {
    const params = new URLSearchParams();
    params.append('file_path', request.file_path);

    const response = await fetch(`${this.baseUrl}/files?${params.toString()}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
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
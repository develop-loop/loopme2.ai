// ============================================================================
// 基础文件类型
// ============================================================================

export interface FileInfo {
  file_name: string;
  file_path: string;
  size: number;
  encoding: 'text' | 'base64';
  content_sha256: string | null;
  ref: string;
  blob_id: string | null;
  commit_id: string | null;
  last_commit_id: string | null;
  content: string;
  mime_type: string;
  last_modified: Date;
}

export interface FileMetadata {
  mimeType: string;
  size: number;
  lastModified: Date;
}

export interface SaveFileResult {
  file_path: string;
  size: number;
  encoding: string;
  last_modified: string;
  created: boolean;
  renamed_from?: string;
  operation?: 'save' | 'rename';
}

export interface MultipleFilesResponse {
  files: FileInfo[];
  total_count: number;
  success_count: number;
  error_count: number;
  errors?: Array<{
    file_path: string;
    error: string;
    message: string;
  }>;
}

// ============================================================================
// Files API 请求参数（前端使用的纯接口）
// ============================================================================

export interface GetFilesRequest {
  file_paths: string[];
  encoding?: 'auto' | 'text' | 'base64';
  metadata_only?: boolean;
}

export interface SaveFileRequest {
  file_path: string;
  content: string;
  encoding?: string;
  commit_message: string;
  author_name?: string;
  author_email?: string;
  previous_path?: string;
}

export interface SaveMultipleFilesRequest {
  files: SaveFileRequest[];
}

export interface DeleteFileRequest {
  file_paths: string[];
}

// ============================================================================
// Files API 响应类型
// ============================================================================

export interface GetFilesResponse {
  success: boolean;
  data: MultipleFilesResponse;
  message?: string;
}

export interface SaveFileResponse {
  success: boolean;
  data: SaveFileResult;
  message?: string;
}

export interface SaveMultipleFilesResponse {
  success: boolean;
  data: {
    results: SaveFileResult[];
    total_count: number;
    success_count: number;
    error_count: number;
    errors?: Array<{
      file_path: string;
      error: string;
      message: string;
    }>;
  };
  message?: string;
}

export interface DeleteFileResponse {
  success: boolean;
  message?: string;
}

export interface DeleteMultipleFilesResponse {
  success: boolean;
  data: {
    results: Array<{
      file_path: string;
      deleted: boolean;
    }>;
    total_count: number;
    success_count: number;
    error_count: number;
    errors?: Array<{
      file_path: string;
      error: string;
      message: string;
    }>;
  };
  message?: string;
}

// ============================================================================
// 查询参数类型（用于GET请求的URL参数）
// ============================================================================

export interface GetFilesQueryParams {
  file_paths: string; // URL中为JSON字符串
  encoding?: string;
  metadata_only?: string; // URL中为字符串 "true"/"false"
}

export interface SaveFileQueryParams {
  file_path: string;
}

export interface DeleteFileQueryParams {
  file_paths: string; // URL中为JSON字符串
}
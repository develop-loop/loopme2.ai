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
export interface GetFilesQueryParams {
    file_paths: string;
    encoding?: string;
    metadata_only?: string;
}
export interface SaveFileQueryParams {
    file_path: string;
}
export interface DeleteFileQueryParams {
    file_paths: string;
}

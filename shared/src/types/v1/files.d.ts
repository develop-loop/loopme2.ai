export interface BlobInfo {
    file_name: string;
    file_path: string;
    size: number;
    encoding: 'text' | 'base64';
    mime_type: string;
    last_modified: Date;
}
export interface BlobMetadata {
    mimeType: string;
    size: number;
    lastModified: Date;
}
export interface MultipleBlobsResponse {
    blobs: BlobInfo[];
    total_count: number;
    success_count: number;
    error_count: number;
    errors?: Array<{
        file_path: string;
        error: string;
        message: string;
    }>;
}
export interface GetBlobsRequest {
    file_paths: string[];
}
export interface GetBlobsResponse {
    success: boolean;
    data: MultipleBlobsResponse;
    message?: string;
}
export interface GetBlobsQueryParams {
    file_paths: string;
}
export interface MarkdownInfo {
    file_name: string;
    file_path: string;
    size: number;
    last_modified: Date;
    content: string;
    frontmatter?: Record<string, any>;
}
export interface MultipleMarkdownsResponse {
    markdowns: MarkdownInfo[];
    total_count: number;
    success_count: number;
    error_count: number;
    errors?: Array<{
        file_path: string;
        error: string;
        message: string;
    }>;
}
export interface GetMarkdownsRequest {
    file_paths: string[];
}
export interface GetMarkdownsResponse {
    success: boolean;
    data: MultipleMarkdownsResponse;
    message?: string;
}
export interface GetMarkdownsQueryParams {
    file_paths: string;
}
export interface SaveMarkdownRequest {
    file_path: string;
    content: string;
    commit_message: string;
    author_name?: string;
    author_email?: string;
    previous_path?: string;
    frontmatter?: Record<string, any>;
}
export interface SaveMultipleMarkdownsRequest {
    files: SaveMarkdownRequest[];
}
export interface SaveMarkdownResult {
    file_path: string;
    size: number;
    last_modified: string;
    created: boolean;
    renamed_from?: string;
    operation?: 'save' | 'rename';
}
export interface SaveMarkdownResponse {
    success: boolean;
    data: SaveMarkdownResult;
    message?: string;
}
export interface SaveMultipleMarkdownsResponse {
    success: boolean;
    data: {
        results: SaveMarkdownResult[];
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
export interface UpdateFrontmatterRequest {
    file_path: string;
    frontmatter_updates: Record<string, any>;
    commit_message: string;
    author_name?: string;
    author_email?: string;
}
export interface UpdateMultipleFrontmatterRequest {
    files: UpdateFrontmatterRequest[];
}
export interface UpdateFrontmatterResult {
    file_path: string;
    size: number;
    last_modified: string;
    updated_keys: string[];
    current_frontmatter: Record<string, any>;
}
export interface UpdateFrontmatterResponse {
    success: boolean;
    data: UpdateFrontmatterResult;
    message?: string;
}
export interface UpdateMultipleFrontmatterResponse {
    success: boolean;
    data: {
        results: UpdateFrontmatterResult[];
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
export interface DeleteFrontmatterRequest {
    file_path: string;
    frontmatter_keys: string[];
    commit_message: string;
    author_name?: string;
    author_email?: string;
}
export interface DeleteMultipleFrontmatterRequest {
    files: DeleteFrontmatterRequest[];
}
export interface DeleteFrontmatterResult {
    file_path: string;
    size: number;
    last_modified: string;
    deleted_keys: string[];
    remaining_frontmatter: Record<string, any>;
}
export interface DeleteFrontmatterResponse {
    success: boolean;
    data: DeleteFrontmatterResult;
    message?: string;
}
export interface DeleteMultipleFrontmatterResponse {
    success: boolean;
    data: {
        results: DeleteFrontmatterResult[];
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

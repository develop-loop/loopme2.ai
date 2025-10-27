import { GetFilesRequest, GetFilesResponse, SaveFileRequest, SaveFileResponse, DeleteFileResponse, DeleteMultipleFilesResponse, SaveMultipleFilesRequest, SaveMultipleFilesResponse } from '../types/files';
export declare class FilesApiClient {
    private baseUrl;
    constructor(baseUrl?: string);
    getFiles(request: GetFilesRequest): Promise<GetFilesResponse>;
    getFile(filePath: string, encoding?: string): Promise<GetFilesResponse>;
    saveFile(request: SaveFileRequest): Promise<SaveFileResponse>;
    saveMultipleFiles(request: SaveMultipleFilesRequest): Promise<SaveMultipleFilesResponse>;
    deleteFile(filePath: string): Promise<DeleteFileResponse>;
    deleteMultipleFiles(filePaths: string[]): Promise<DeleteMultipleFilesResponse>;
    getFileMetadata(filePath: string): Promise<Response>;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesApiClient = void 0;
class FilesApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }
    async getFiles(request) {
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
    async getFile(filePath, encoding) {
        return this.getFiles({
            file_paths: [filePath],
            encoding: encoding,
        });
    }
    async saveFile(request) {
        const multipleResponse = await this.saveMultipleFiles({
            files: [request]
        });
        if (multipleResponse.success && multipleResponse.data.results.length > 0) {
            return {
                success: true,
                data: multipleResponse.data.results[0],
                message: multipleResponse.message
            };
        }
        else {
            throw new Error(multipleResponse.data.errors?.[0]?.message || 'Failed to save file');
        }
    }
    async saveMultipleFiles(request) {
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
    async deleteFile(filePath) {
        const multipleResponse = await this.deleteMultipleFiles([filePath]);
        if (multipleResponse.success && multipleResponse.data.results.length > 0) {
            return {
                success: true,
                message: multipleResponse.message
            };
        }
        else {
            throw new Error(multipleResponse.data.errors?.[0]?.message || 'Failed to delete file');
        }
    }
    async deleteMultipleFiles(filePaths) {
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
    async getFileMetadata(filePath) {
        return this.getFiles({
            file_paths: [filePath],
            metadata_only: true,
        });
    }
}
exports.FilesApiClient = FilesApiClient;
//# sourceMappingURL=files-api-client.js.map
import { Controller, Get, Put, Delete, Body, Query, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { SaveFileDto, SaveMultipleFilesDto } from '../../dto/file.dto';
import { GetFilesResponse, SaveFileResponse, DeleteFileResponse, DeleteMultipleFilesResponse, SaveMultipleFilesResponse, SaveFileResult, MultipleFilesResponse, FileMetadata } from '@shared/types/files';
import { GetFilesResponseDto, SaveFileResponseDto, DeleteFileResponseDto, SaveMultipleFilesResponseDto, DeleteMultipleFilesResponseDto } from './dto/response.dto';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get files', 
    description: 'Retrieve content of one or multiple files. Always returns a list format with files array, success/error counts, and optional errors.' 
  })
  @ApiQuery({ 
    name: 'file_paths', 
    description: 'Array of file paths to retrieve', 
    required: true,
    type: [String],
    example: ['file.txt', 'folder/another.txt']
  })
  @ApiQuery({ name: 'encoding', description: 'File encoding (auto, text, base64)', required: false })
  @ApiQuery({ name: 'metadata_only', description: 'Return only metadata without content', required: false, type: Boolean })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Files retrieved successfully',
    type: GetFilesResponseDto
  })
  @SwaggerApiResponse({ status: 400, description: 'Invalid file paths or parameters' })
  @SwaggerApiResponse({ status: 404, description: 'One or more files not found' })
  async getFiles(
    @Query('file_paths') filePaths: string | string[],
    @Query('encoding') encoding?: string,
    @Query('metadata_only') metadataOnly?: string
  ): Promise<GetFilesResponse> {
    try {
      // 处理file_paths参数 - 可能是单个字符串或数组
      let processedFilePaths: string[];
      if (typeof filePaths === 'string') {
        // 如果是字符串，尝试解析为JSON数组，否则当作单个文件
        try {
          processedFilePaths = JSON.parse(filePaths);
        } catch {
          processedFilePaths = [filePaths];
        }
      } else if (Array.isArray(filePaths)) {
        processedFilePaths = filePaths;
      } else {
        throw new BadRequestException('Please provide file_paths parameter as string or array');
      }

      if (!processedFilePaths || processedFilePaths.length === 0) {
        throw new BadRequestException('Please provide at least one file path');
      }

      const isMetadataOnly = metadataOnly === 'true';

      // 如果只要metadata，也返回统一的JSON格式
      if (isMetadataOnly && processedFilePaths.length === 1) {
        const metadata = await this.filesService.getFileMetadata(processedFilePaths[0]);
        
        return {
          success: true,
          data: {
            files: [{
              file_name: processedFilePaths[0],
              file_path: processedFilePaths[0],
              size: metadata.size,
              encoding: 'text' as const,
              content_sha256: null,
              ref: '',
              blob_id: null,
              commit_id: null,
              last_commit_id: null,
              content: '', // metadata-only所以不返回内容
              mime_type: metadata.mimeType,
              last_modified: metadata.lastModified
            }],
            total_count: 1,
            success_count: 1,
            error_count: 0,
            errors: []
          }
        };
      }

      // 统一使用 getMultipleFiles 返回列表格式
      const result = await this.filesService.getMultipleFiles(processedFilePaths, encoding);
      return {
        success: true,
        data: result
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while reading files';
      
      if (errorMessage.includes('does not exist') || errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid file path') || errorMessage.includes('not a file') || errorMessage.includes('binary file')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to read files');
    }
  }

  @Put('')
  @ApiOperation({ 
    summary: 'Save multiple files', 
    description: 'Create or update multiple files in a single request. Files data is passed in request body as an array.' 
  })
  @ApiBody({ type: SaveMultipleFilesDto })
  @SwaggerApiResponse({ status: 200, description: 'Files processed successfully', type: SaveMultipleFilesResponseDto })
  @SwaggerApiResponse({ status: 400, description: 'Invalid file data' })
  async saveFiles(@Body() body: SaveMultipleFilesDto): Promise<SaveMultipleFilesResponse> {
    try {
      if (!body.files || body.files.length === 0) {
        throw new BadRequestException('Please provide files array with at least one file');
      }

      const results: SaveFileResult[] = [];
      const errors: Array<{ file_path: string; error: string; message: string; }> = [];

      // 处理每个文件
      for (const fileData of body.files) {
        try {
          const { file_path, content, encoding = 'text', commit_message, author_name, author_email, previous_path } = fileData;

          if (!file_path || !content || !commit_message) {
            errors.push({
              file_path: file_path || 'unknown',
              error: 'VALIDATION_ERROR',
              message: 'Missing required fields: file_path, content, commit_message'
            });
            continue;
          }

          // Handle file rename if previous_path is provided
          if (previous_path && previous_path !== file_path) {
            try {
              // Use the dedicated rename method for better git history
              const result = await this.filesService.renameFile(previous_path, file_path, content, encoding, {
                commitMessage: commit_message,
                authorName: author_name,
                authorEmail: author_email
              });

              results.push({
                ...result,
                renamed_from: previous_path,
                operation: 'rename'
              });

            } catch (error) {
              errors.push({
                file_path,
                error: 'RENAME_ERROR',
                message: `Rename operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
            }
          } else {
            // Normal save operation
            const result = await this.filesService.saveFile(file_path, content, encoding, {
              commitMessage: commit_message,
              authorName: author_name,
              authorEmail: author_email
            });

            results.push(result);
          }

        } catch (error) {
          errors.push({
            file_path: fileData.file_path || 'unknown',
            error: 'SAVE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      }

      const total_count = body.files.length;
      const success_count = results.length;
      const error_count = errors.length;

      return {
        success: success_count > 0, // 至少有一个文件成功才算成功
        data: {
          results,
          total_count,
          success_count,
          error_count,
          errors: error_count > 0 ? errors : undefined
        },
        message: error_count === 0 
          ? `All ${success_count} files processed successfully`
          : `${success_count} files processed successfully, ${error_count} files failed`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving files';
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('provide')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to save files');
    }
  }

  @Delete('')
  @ApiOperation({ summary: 'Delete multiple files', description: 'Delete one or multiple files from storage' })
  @ApiQuery({ 
    name: 'file_paths', 
    description: 'Array of file paths to delete', 
    required: true,
    type: [String],
    example: ['file.txt', 'folder/another.txt']
  })
  @SwaggerApiResponse({ status: 200, description: 'Files processed successfully', type: DeleteMultipleFilesResponseDto })
  @SwaggerApiResponse({ status: 400, description: 'Invalid file paths' })
  @SwaggerApiResponse({ status: 404, description: 'One or more files not found' })
  async deleteFiles(@Query('file_paths') filePaths: string | string[]): Promise<DeleteMultipleFilesResponse> {
    try {
      // 处理file_paths参数 - 可能是单个字符串或数组
      let processedFilePaths: string[];
      if (typeof filePaths === 'string') {
        // 如果是字符串，尝试解析为JSON数组，否则当作单个文件
        try {
          processedFilePaths = JSON.parse(filePaths);
        } catch {
          processedFilePaths = [filePaths];
        }
      } else if (Array.isArray(filePaths)) {
        processedFilePaths = filePaths;
      } else {
        throw new BadRequestException('Please provide file_paths parameter as string or array');
      }

      if (!processedFilePaths || processedFilePaths.length === 0) {
        throw new BadRequestException('Please provide at least one file path');
      }

      const results: Array<{ file_path: string; deleted: boolean; }> = [];
      const errors: Array<{ file_path: string; error: string; message: string; }> = [];

      // 处理每个文件删除
      for (const filePath of processedFilePaths) {
        try {
          await this.filesService.deleteFile(filePath);
          results.push({
            file_path: filePath,
            deleted: true
          });
        } catch (error) {
          errors.push({
            file_path: filePath,
            error: 'DELETE_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      }

      const total_count = processedFilePaths.length;
      const success_count = results.length;
      const error_count = errors.length;

      return {
        success: success_count > 0, // 至少有一个文件成功删除才算成功
        data: {
          results,
          total_count,
          success_count,
          error_count,
          errors: error_count > 0 ? errors : undefined
        },
        message: error_count === 0 
          ? `All ${success_count} files deleted successfully`
          : `${success_count} files deleted successfully, ${error_count} files failed`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting files';
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('provide')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to delete files');
    }
  }
}
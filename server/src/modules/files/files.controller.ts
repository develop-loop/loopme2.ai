import { Controller, Get, Put, Delete, Body, Query, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { SaveFileDto } from '../../dto/file.dto';
import { GetFilesResponse, SaveFileResponse, DeleteFileResponse, SaveFileResult, MultipleFilesResponse, FileMetadata } from '@shared/types/files';
import { GetFilesResponseDto, SaveFileResponseDto, DeleteFileResponseDto } from './dto/response.dto';

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
  @ApiOperation({ summary: 'Save file', description: 'Create a new file or update existing file content' })
  @ApiQuery({ name: 'file_path', description: 'Path where the file will be saved', required: true })
  @ApiBody({ type: SaveFileDto })
  @SwaggerApiResponse({ status: 200, description: 'File updated successfully', type: SaveFileResponseDto })
  @SwaggerApiResponse({ status: 201, description: 'File created successfully', type: SaveFileResponseDto })
  @SwaggerApiResponse({ status: 400, description: 'Invalid file path or content' })
  async saveFile(@Query('file_path') filePath: string, @Body() body: SaveFileDto): Promise<SaveFileResponse> {
    try {
      if (!filePath) {
        throw new BadRequestException('Please provide file_path query parameter');
      }

      const { content, encoding = 'text', commit_message, author_name, author_email, previous_path } = body;

      if (!content || !commit_message) {
        throw new BadRequestException('Missing required fields: content, commit_message');
      }

      // Handle file rename if previous_path is provided
      if (previous_path && previous_path !== filePath) {
        try {
          // Save the new file
          const result = await this.filesService.saveFile(filePath, content, encoding, {
            commitMessage: commit_message,
            authorName: author_name,
            authorEmail: author_email
          });

          // Delete the old file
          await this.filesService.deleteFile(previous_path);

          return {
            success: true,
            data: {
              ...result,
              renamed_from: previous_path,
              operation: 'rename'
            },
            message: 'File renamed successfully'
          };

        } catch (error) {
          throw new Error(`Rename operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // Normal save operation
        const result = await this.filesService.saveFile(filePath, content, encoding, {
          commitMessage: commit_message,
          authorName: author_name,
          authorEmail: author_email
        });

        return {
          success: true,
          data: result,
          message: result.created ? 'File created successfully' : 'File updated successfully'
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving the file';
      
      if (errorMessage.includes('Invalid file path') || errorMessage.includes('Invalid content')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to save file');
    }
  }

  @Delete('')
  @ApiOperation({ summary: 'Delete file', description: 'Delete a file from storage' })
  @ApiQuery({ name: 'file_path', description: 'Path to the file to delete', required: true })
  @SwaggerApiResponse({ status: 200, description: 'File deleted successfully', type: DeleteFileResponseDto })
  @SwaggerApiResponse({ status: 400, description: 'Invalid file path' })
  @SwaggerApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Query('file_path') filePath: string): Promise<DeleteFileResponse> {
    try {
      if (!filePath) {
        throw new BadRequestException('Please provide file_path query parameter');
      }

      await this.filesService.deleteFile(filePath);

      return {
        success: true,
        message: 'File deleted successfully'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting the file';
      
      if (errorMessage.includes('does not exist')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid file path')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to delete file');
    }
  }
}
import { Controller, Get, Put, Delete, Body, Query, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { V1FilesService } from './files.service';
import { V1MarkdownService } from './markdown.service';
import { SaveMultipleMarkdownsDto } from './dto/markdown.dto';
import { UpdateMultipleFrontmatterDto, DeleteMultipleFrontmatterDto } from './dto/frontmatter.dto';
import { V1Files } from '@shared/index';

@ApiTags('V1 Files')
@Controller('v1/files')
export class V1FilesController {
  constructor(
    private readonly v1FilesService: V1FilesService,
    private readonly v1MarkdownService: V1MarkdownService
  ) {}

  @Get('blob')
  @ApiOperation({ 
    summary: 'Get file blobs (V1)', 
    description: 'Retrieve metadata of one or multiple files without content. Optimized for large files by returning only file size and metadata. V1 API always returns a list format with blobs array, success/error counts, and optional errors.' 
  })
  @ApiQuery({ 
    name: 'file_paths', 
    description: 'Array of file paths to retrieve', 
    required: true,
    type: [String],
    example: ['file.txt', 'folder/another.txt']
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'File blobs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            blobs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file_name: { type: 'string' },
                  file_path: { type: 'string' },
                  size: { type: 'number' },
                  encoding: { type: 'string', enum: ['text', 'base64'] },
                  mime_type: { type: 'string' },
                  last_modified: { type: 'string', format: 'date-time' }
                }
              }
            },
            total_count: { type: 'number' },
            success_count: { type: 'number' },
            error_count: { type: 'number' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file_path: { type: 'string' },
                  error: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @SwaggerApiResponse({ status: 400, description: 'Invalid file paths or parameters' })
  @SwaggerApiResponse({ status: 404, description: 'One or more files not found' })
  async getBlobs(
    @Query('file_paths') filePaths: string | string[]
  ): Promise<V1Files.GetBlobsResponse> {
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

      // blob endpoint always returns metadata only (no content)
      const result = await this.v1FilesService.getMultipleBlobs(processedFilePaths);
      return {
        success: true,
        data: result
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while reading file blobs';
      
      if (errorMessage.includes('does not exist') || errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid file path') || errorMessage.includes('not a file')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to read file blobs');
    }
  }

  @Get('markdown')
  @ApiOperation({ 
    summary: 'Get markdown files (V1)', 
    description: 'Retrieve content and frontmatter of one or multiple markdown files. Only processes .md and .markdown files. V1 API returns a list format with markdowns array, success/error counts, and optional errors.' 
  })
  @ApiQuery({ 
    name: 'file_paths', 
    description: 'Array of markdown file paths to retrieve', 
    required: true,
    type: [String],
    example: ['README.md', 'docs/guide.md']
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Markdown files retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            markdowns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file_name: { type: 'string' },
                  file_path: { type: 'string' },
                  size: { type: 'number' },
                  last_modified: { type: 'string', format: 'date-time' },
                  content: { type: 'string' },
                  frontmatter: { 
                    type: 'object', 
                    additionalProperties: true,
                    description: 'Parsed frontmatter as key-value pairs'
                  }
                }
              }
            },
            total_count: { type: 'number' },
            success_count: { type: 'number' },
            error_count: { type: 'number' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file_path: { type: 'string' },
                  error: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @SwaggerApiResponse({ status: 400, description: 'Invalid file paths or non-markdown files' })
  @SwaggerApiResponse({ status: 404, description: 'One or more markdown files not found' })
  async getMarkdowns(
    @Query('file_paths') filePaths: string | string[]
  ): Promise<V1Files.GetMarkdownsResponse> {
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

      // Get markdown files with content and frontmatter
      const result = await this.v1MarkdownService.getMultipleMarkdowns(processedFilePaths);
      return {
        success: true,
        data: result
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while reading markdown files';
      
      if (errorMessage.includes('does not exist') || errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid file path') || errorMessage.includes('not a file') || errorMessage.includes('not a markdown file')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to read markdown files');
    }
  }

  @Put('markdown')
  @ApiOperation({ 
    summary: 'Save multiple markdown files (V1)', 
    description: 'Create or update multiple markdown files in a single request. Supports frontmatter metadata and file operations. V1 API performs pure file system operations without git integration for better performance.' 
  })
  @ApiBody({ type: SaveMultipleMarkdownsDto })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Markdown files processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file_path: { type: 'string' },
                  size: { type: 'number' },
                  last_modified: { type: 'string', format: 'date-time' },
                  created: { type: 'boolean' },
                  renamed_from: { type: 'string' },
                  operation: { type: 'string', enum: ['save', 'rename'] }
                }
              }
            },
            total_count: { type: 'number' },
            success_count: { type: 'number' },
            error_count: { type: 'number' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file_path: { type: 'string' },
                  error: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @SwaggerApiResponse({ status: 400, description: 'Invalid markdown file data' })
  async saveMarkdowns(@Body() body: SaveMultipleMarkdownsDto): Promise<V1Files.SaveMultipleMarkdownsResponse> {
    try {
      if (!body.files || body.files.length === 0) {
        throw new BadRequestException('Please provide files array with at least one markdown file');
      }

      return await this.v1MarkdownService.saveMultipleMarkdowns(body.files);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving markdown files';
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('provide')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to save markdown files');
    }
  }

  @Put('markdown/frontmatter')
  @ApiOperation({ 
    summary: 'Update markdown frontmatter (V1)', 
    description: 'Update specific frontmatter keys in multiple markdown files without modifying content. Performs partial updates by merging provided keys with existing frontmatter. V1 API performs file system operations with git integration.' 
  })
  @ApiBody({ type: UpdateMultipleFrontmatterDto })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Frontmatter updates processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file_path: { type: 'string' },
                  size: { type: 'number' },
                  last_modified: { type: 'string', format: 'date-time' },
                  updated_keys: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'List of frontmatter keys that were updated'
                  },
                  current_frontmatter: { 
                    type: 'object', 
                    additionalProperties: true,
                    description: 'Complete frontmatter after updates'
                  }
                }
              }
            },
            total_count: { type: 'number' },
            success_count: { type: 'number' },
            error_count: { type: 'number' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file_path: { type: 'string' },
                  error: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @SwaggerApiResponse({ status: 400, description: 'Invalid frontmatter update data' })
  @SwaggerApiResponse({ status: 404, description: 'One or more markdown files not found' })
  async updateFrontmatter(@Body() body: UpdateMultipleFrontmatterDto): Promise<V1Files.UpdateMultipleFrontmatterResponse> {
    try {
      if (!body.files || body.files.length === 0) {
        throw new BadRequestException('Please provide files array with at least one frontmatter update');
      }

      return await this.v1MarkdownService.updateMultipleFrontmatter(body.files);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating frontmatter';
      
      if (errorMessage.includes('does not exist') || errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid') || errorMessage.includes('provide') || errorMessage.includes('not a markdown file')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to update frontmatter');
    }
  }

  @Delete('markdown/frontmatter')
  @ApiOperation({ 
    summary: 'Delete markdown frontmatter (V1)', 
    description: 'Delete specific frontmatter keys or all frontmatter from multiple markdown files. Use ["*"] to delete all frontmatter. V1 API performs file system operations with git integration.' 
  })
  @ApiBody({ type: DeleteMultipleFrontmatterDto })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Frontmatter deletions processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file_path: { type: 'string' },
                  size: { type: 'number' },
                  last_modified: { type: 'string', format: 'date-time' },
                  deleted_keys: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'List of frontmatter keys that were deleted'
                  },
                  remaining_frontmatter: { 
                    type: 'object', 
                    additionalProperties: true,
                    description: 'Remaining frontmatter after deletions'
                  }
                }
              }
            },
            total_count: { type: 'number' },
            success_count: { type: 'number' },
            error_count: { type: 'number' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  file_path: { type: 'string' },
                  error: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @SwaggerApiResponse({ status: 400, description: 'Invalid frontmatter deletion data' })
  @SwaggerApiResponse({ status: 404, description: 'One or more markdown files not found' })
  async deleteFrontmatter(@Body() body: DeleteMultipleFrontmatterDto): Promise<V1Files.DeleteMultipleFrontmatterResponse> {
    try {
      if (!body.files || body.files.length === 0) {
        throw new BadRequestException('Please provide files array with at least one frontmatter deletion');
      }

      return await this.v1MarkdownService.deleteMultipleFrontmatter(body.files);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting frontmatter';
      
      if (errorMessage.includes('does not exist') || errorMessage.includes('not found')) {
        throw new NotFoundException(errorMessage);
      }

      if (errorMessage.includes('Invalid') || errorMessage.includes('provide') || errorMessage.includes('not a markdown file')) {
        throw new BadRequestException(errorMessage);
      }

      throw new InternalServerErrorException('Failed to delete frontmatter');
    }
  }
}
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQuery, SearchResponse } from '@shared/types/search';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Search files and content', 
    description: 'Search for files by name or content using find and grep commands. Returns the top 20 most relevant results.' 
  })
  @ApiQuery({ name: 'q', description: 'Search query (required)', required: true, type: String })
  @ApiQuery({ name: 'type', description: 'Search type: filename, content, or both (default: both)', required: false, enum: ['filename', 'content', 'both'] })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results (default: 20, max: 50)', required: false, type: Number })
  @ApiQuery({ name: 'include_hidden', description: 'Include hidden files and directories (default: false)', required: false, type: Boolean })
  @ApiQuery({ name: 'file_types', description: 'Comma-separated file extensions to include (e.g., "js,ts,md")', required: false, type: String })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Search completed successfully',
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
                  type: { type: 'string', enum: ['file', 'content'] },
                  path: { type: 'string' },
                  filename: { type: 'string' },
                  line: { type: 'number' },
                  content: { type: 'string' },
                  matchedText: { type: 'string' },
                  score: { type: 'number' }
                }
              }
            },
            total_count: { type: 'number' },
            query: { type: 'string' },
            search_type: { type: 'string' }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  @SwaggerApiResponse({ status: 400, description: 'Invalid search parameters' })
  async search(
    @Query('q') q?: string,
    @Query('type') type?: 'filename' | 'content' | 'both',
    @Query('limit') limit?: string,
    @Query('include_hidden') includeHidden?: string,
    @Query('file_types') fileTypes?: string
  ): Promise<SearchResponse> {
    try {
      // Validate required parameters
      if (!q || q.trim().length === 0) {
        throw new BadRequestException('Search query (q) is required');
      }

      // Parse and validate limit
      const parsedLimit = limit ? parseInt(limit, 10) : 20;
      if (parsedLimit < 1 || parsedLimit > 50) {
        throw new BadRequestException('Limit must be between 1 and 50');
      }

      // Parse include_hidden
      const parsedIncludeHidden = includeHidden === 'true';

      // Parse file_types
      const parsedFileTypes = fileTypes ? 
        fileTypes.split(',').map(ext => ext.trim()).filter(ext => ext.length > 0) : 
        [];

      // Validate search type
      if (type && !['filename', 'content', 'both'].includes(type)) {
        throw new BadRequestException('Search type must be one of: filename, content, both');
      }

      const searchQuery: SearchQuery = {
        q: q.trim(),
        type: type || 'both',
        limit: parsedLimit,
        include_hidden: parsedIncludeHidden,
        file_types: parsedFileTypes
      };

      return await this.searchService.search(searchQuery);

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Error in search controller:', error);
      throw new BadRequestException('Failed to perform search');
    }
  }
}
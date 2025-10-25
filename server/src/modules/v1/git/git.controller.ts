import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery } from '@nestjs/swagger';
import { V1GitService } from './git.service';
import { V1Git } from '@shared/index';

@ApiTags('V1 Git')
@Controller('v1/git')
export class V1GitController {
  constructor(private readonly v1GitService: V1GitService) {}

  @Get('commits')
  @ApiOperation({ 
    summary: 'Get git commits (V1)', 
    description: 'Retrieve git commits with pagination and filtering options. V1 API compatible with GitLab API format.' 
  })
  @ApiQuery({ name: 'page', description: 'Page number (default: 1)', required: false, type: Number })
  @ApiQuery({ name: 'per_page', description: 'Number of commits per page (default: 20, max: 100)', required: false, type: Number })
  @ApiQuery({ name: 'ref_name', description: 'Branch or ref name (default: HEAD)', required: false, type: String })
  @ApiQuery({ name: 'since', description: 'Return commits after this date (ISO 8601)', required: false, type: String })
  @ApiQuery({ name: 'until', description: 'Return commits before this date (ISO 8601)', required: false, type: String })
  @ApiQuery({ name: 'path', description: 'File path to filter commits', required: false, type: String })
  @ApiQuery({ name: 'author', description: 'Author name or email to filter commits', required: false, type: String })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Commits retrieved successfully'
  })
  @SwaggerApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getCommits(
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
    @Query('ref_name') refName?: string,
    @Query('since') since?: string,
    @Query('until') until?: string,
    @Query('path') path?: string,
    @Query('author') author?: string
  ): Promise<V1Git.GitCommitsResponse> {
    try {
      // Validate and parse parameters
      const pageNum = page ? parseInt(page, 10) : 1;
      const perPageNum = perPage ? parseInt(perPage, 10) : 20;

      if (pageNum < 1) {
        throw new BadRequestException('Page number must be greater than 0');
      }

      if (perPageNum < 1 || perPageNum > 100) {
        throw new BadRequestException('Per page must be between 1 and 100');
      }

      // Validate date formats if provided
      if (since) {
        try {
          new Date(since).toISOString();
        } catch {
          throw new BadRequestException('Invalid since date format. Use ISO 8601 format.');
        }
      }

      if (until) {
        try {
          new Date(until).toISOString();
        } catch {
          throw new BadRequestException('Invalid until date format. Use ISO 8601 format.');
        }
      }

      const query: V1Git.GitCommitsQuery = {
        page: pageNum,
        per_page: perPageNum,
        ref_name: refName,
        since,
        until,
        path,
        author
      };

      return await this.v1GitService.getCommits(query);

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Error in V1 getCommits controller:', error);
      throw new BadRequestException('Failed to retrieve commits');
    }
  }

  @Get('config')
  @ApiOperation({ 
    summary: 'Get git configuration (V1)', 
    description: 'Retrieve git configuration settings using git config --list. V1 API format.' 
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Git configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        message: { type: 'string' }
      }
    }
  })
  async getGitConfig(): Promise<V1Git.GitConfigResponse> {
    return await this.v1GitService.getGitConfig();
  }
}
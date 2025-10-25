import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiQuery } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { WorkspaceQuery, WorkspaceResponse } from '@shared/types/workspace';

@ApiTags('Workspace')
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get workspaces', 
    description: 'Find files with workspace metadata in the first 10 lines and group them by workspace. Uses grep -n to find "workspace:" patterns in markdown frontmatter.' 
  })
  @ApiQuery({ name: 'limit', description: 'Maximum number of files per workspace (default: 100)', required: false, type: Number })
  @ApiQuery({ name: 'include_hidden', description: 'Include hidden files and directories (default: false)', required: false, type: Boolean })
  @ApiQuery({ name: 'file_types', description: 'Comma-separated file extensions to include (e.g., "md,txt")', required: false, type: String })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Workspaces retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            workspaces: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  workspace: { type: 'string' },
                  files: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        path: { type: 'string' },
                        filename: { type: 'string' },
                        workspace: { type: 'string' },
                        line: { type: 'number' }
                      }
                    }
                  },
                  count: { type: 'number' }
                }
              }
            },
            total_workspaces: { type: 'number' },
            total_files: { type: 'number' }
          }
        },
        message: { type: 'string' }
      }
    }
  })
  async getWorkspaces(
    @Query('limit') limit?: string,
    @Query('include_hidden') includeHidden?: string,
    @Query('file_types') fileTypes?: string
  ): Promise<WorkspaceResponse> {
    try {
      // Parse and validate limit
      const parsedLimit = limit ? parseInt(limit, 10) : 100;
      
      // Parse include_hidden
      const parsedIncludeHidden = includeHidden === 'true';

      // Parse file_types
      const parsedFileTypes = fileTypes ? 
        fileTypes.split(',').map(ext => ext.trim()).filter(ext => ext.length > 0) : 
        [];

      const workspaceQuery: WorkspaceQuery = {
        limit: parsedLimit,
        include_hidden: parsedIncludeHidden,
        file_types: parsedFileTypes
      };

      return await this.workspaceService.getWorkspaces(workspaceQuery);

    } catch (error) {
      console.error('Error in workspace controller:', error);
      return {
        success: false,
        data: {
          workspaces: [],
          total_workspaces: 0,
          total_files: 0
        },
        message: error instanceof Error ? error.message : 'Failed to retrieve workspaces'
      };
    }
  }
}
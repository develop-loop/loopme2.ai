import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { GitService, GitConfigResponse } from './git.service';

@ApiTags('Git')
@Controller('gitconfig')
export class GitController {
  constructor(private readonly gitService: GitService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get git configuration', 
    description: 'Retrieve git configuration settings using git config --list' 
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
  async getGitConfig(): Promise<GitConfigResponse> {
    return await this.gitService.getGitConfig();
  }
}
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiResponse } from '@shared/types/common';

@ApiTags('General')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get welcome message', description: 'Returns a welcome message from the API' })
  @SwaggerApiResponse({ status: 200, description: 'Welcome message returned successfully' })
  getHello(): ApiResponse<string> {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check', description: 'Check if the API is running and healthy' })
  @SwaggerApiResponse({ status: 200, description: 'Health status returned successfully' })
  getHealth(): ApiResponse<{ status: string; timestamp: string }> {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
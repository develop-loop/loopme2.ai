import { Injectable } from '@nestjs/common';
import { ApiResponse } from '@shared/types/common';

@Injectable()
export class AppService {
  getHello(): ApiResponse<string> {
    return {
      success: true,
      data: 'Hello World from NestJS!',
      message: 'Welcome to LoopMe3 API',
    };
  }
}
import { Module } from '@nestjs/common';
import { V1SearchController } from './search.controller';
import { V1SearchService } from './search.service';

@Module({
  controllers: [V1SearchController],
  providers: [V1SearchService],
  exports: [V1SearchService]
})
export class V1SearchModule {}
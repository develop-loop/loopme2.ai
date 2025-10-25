import { Module } from '@nestjs/common';
import { V1GitController } from './git.controller';
import { V1GitService } from './git.service';

@Module({
  controllers: [V1GitController],
  providers: [V1GitService],
  exports: [V1GitService]
})
export class V1GitModule {}
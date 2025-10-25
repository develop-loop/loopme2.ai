import { Module } from '@nestjs/common';
import { V1FilesController } from './files.controller';
import { V1FilesService } from './files.service';
import { V1MarkdownService } from './markdown.service';
import { FileGitService } from './file-git.service';

@Module({
  controllers: [V1FilesController],
  providers: [V1FilesService, V1MarkdownService, FileGitService],
  exports: [V1FilesService, V1MarkdownService, FileGitService]
})
export class V1FilesModule {}
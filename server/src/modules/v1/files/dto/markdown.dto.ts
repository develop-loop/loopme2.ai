import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { V1Files } from '@shared/index';

export class SaveMarkdownDto implements V1Files.SaveMarkdownRequest {
  @ApiProperty({ example: 'docs/guide.md', description: 'Path where the markdown file will be saved' })
  @IsString()
  @IsNotEmpty()
  file_path: string;

  @ApiProperty({ example: '# Title\n\nContent here...', description: 'Markdown content (without frontmatter)' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'Update markdown content', description: 'Commit message for the change' })
  @IsString()
  @IsNotEmpty()
  commit_message: string;

  @ApiProperty({ example: 'John Doe', description: 'Author name', required: false })
  @IsString()
  @IsOptional()
  author_name?: string;

  @ApiProperty({ example: 'john@example.com', description: 'Author email', required: false })
  @IsString()
  @IsOptional()
  author_email?: string;

  @ApiProperty({ example: 'old-guide.md', description: 'Previous file path for rename operation', required: false })
  @IsString()
  @IsOptional()
  previous_path?: string;

  @ApiProperty({ 
    example: { title: 'Guide', author: 'John Doe', tags: ['tutorial', 'markdown'] }, 
    description: 'Frontmatter metadata as key-value pairs', 
    required: false 
  })
  @IsObject()
  @IsOptional()
  frontmatter?: Record<string, any>;
}

export class SaveMultipleMarkdownsDto implements V1Files.SaveMultipleMarkdownsRequest {
  @ApiProperty({ 
    type: [SaveMarkdownDto], 
    description: 'Array of markdown files to save',
    example: [
      {
        file_path: 'docs/guide.md',
        content: '# Guide\n\nThis is a guide...',
        commit_message: 'Add new guide',
        author_name: 'John Doe',
        author_email: 'john@example.com',
        frontmatter: {
          title: 'User Guide',
          author: 'John Doe',
          date: '2023-10-01'
        }
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveMarkdownDto)
  files: SaveMarkdownDto[];
}
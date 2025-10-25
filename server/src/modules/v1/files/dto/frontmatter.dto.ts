import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { V1Files } from '@shared/index';

export class UpdateFrontmatterDto implements V1Files.UpdateFrontmatterRequest {
  @ApiProperty({ example: 'docs/guide.md', description: 'Path to the markdown file' })
  @IsString()
  @IsNotEmpty()
  file_path: string;

  @ApiProperty({ 
    example: { title: 'New Title', author: 'Jane Doe', updated: true }, 
    description: 'Frontmatter key-value pairs to update (partial update)' 
  })
  @IsObject()
  @IsNotEmpty()
  frontmatter_updates: Record<string, any>;

  @ApiProperty({ example: 'Update frontmatter metadata', description: 'Commit message for the change' })
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
}

export class UpdateMultipleFrontmatterDto implements V1Files.UpdateMultipleFrontmatterRequest {
  @ApiProperty({ 
    type: [UpdateFrontmatterDto], 
    description: 'Array of frontmatter updates to apply',
    example: [
      {
        file_path: 'docs/guide.md',
        frontmatter_updates: {
          title: 'Updated Guide Title',
          last_modified: '2023-10-01',
          status: 'published'
        },
        commit_message: 'Update guide metadata',
        author_name: 'John Doe',
        author_email: 'john@example.com'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFrontmatterDto)
  files: UpdateFrontmatterDto[];
}

export class DeleteFrontmatterDto implements V1Files.DeleteFrontmatterRequest {
  @ApiProperty({ example: 'docs/guide.md', description: 'Path to the markdown file' })
  @IsString()
  @IsNotEmpty()
  file_path: string;

  @ApiProperty({ 
    example: ['outdated_field', 'temp_status'], 
    description: 'Specific frontmatter keys to delete. Use ["*"] to delete all frontmatter.',
    required: true,
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  frontmatter_keys: string[];

  @ApiProperty({ example: 'Remove outdated frontmatter fields', description: 'Commit message for the change' })
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
}

export class DeleteMultipleFrontmatterDto implements V1Files.DeleteMultipleFrontmatterRequest {
  @ApiProperty({ 
    type: [DeleteFrontmatterDto], 
    description: 'Array of frontmatter deletions to apply',
    example: [
      {
        file_path: 'docs/guide.md',
        frontmatter_keys: ['outdated_field', 'temp_status'],
        commit_message: 'Remove outdated frontmatter fields',
        author_name: 'John Doe',
        author_email: 'john@example.com'
      },
      {
        file_path: 'docs/old-doc.md',
        frontmatter_keys: ['*'],
        commit_message: 'Remove all frontmatter from old document',
        author_name: 'John Doe',
        author_email: 'john@example.com'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeleteFrontmatterDto)
  files: DeleteFrontmatterDto[];
}
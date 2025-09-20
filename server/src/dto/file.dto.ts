import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SaveFileRequest, GetFilesRequest } from '@shared/types/files';

export class SaveFileDto implements SaveFileRequest {
  @ApiProperty({ example: 'test.txt', description: 'Path where the file will be saved' })
  @IsString()
  @IsNotEmpty()
  file_path: string;

  @ApiProperty({ example: 'Hello World', description: 'File content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'text', description: 'Content encoding', required: false })
  @IsString()
  @IsOptional()
  encoding?: string;

  @ApiProperty({ example: 'Update file content', description: 'Commit message for the change' })
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

  @ApiProperty({ example: 'old-file.txt', description: 'Previous file path for rename operation', required: false })
  @IsString()
  @IsOptional()
  previous_path?: string;
}

export class GetFilesDto implements GetFilesRequest {
  @ApiProperty({ 
    example: ['test.txt', 'folder/another.txt'], 
    description: 'Array of file paths to retrieve',
    type: [String]
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  file_paths: string[];

  @ApiProperty({ 
    example: 'auto', 
    description: 'File encoding format',
    enum: ['auto', 'text', 'base64'],
    required: false
  })
  @IsString()
  @IsOptional()
  encoding?: 'auto' | 'text' | 'base64';

  @ApiProperty({ 
    example: false, 
    description: 'Return only metadata without content',
    required: false
  })
  @IsOptional()
  metadata_only?: boolean;
}
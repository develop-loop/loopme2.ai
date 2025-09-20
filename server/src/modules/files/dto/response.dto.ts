import { ApiProperty } from '@nestjs/swagger';

export class FileInfoDto {
  @ApiProperty({ example: 'test.txt', description: 'File name' })
  file_name: string;

  @ApiProperty({ example: 'test.txt', description: 'File path' })
  file_path: string;

  @ApiProperty({ example: 'Hello World', description: 'File content' })
  content: string;

  @ApiProperty({ example: 1024, description: 'File size in bytes' })
  size: number;

  @ApiProperty({ example: 'text', enum: ['text', 'base64'], description: 'Content encoding' })
  encoding: 'text' | 'base64';

  @ApiProperty({ example: 'text/plain', description: 'MIME type' })
  mime_type: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Last modified date' })
  last_modified: Date;

  @ApiProperty({ example: null, description: 'Content SHA256 hash', nullable: true })
  content_sha256: string | null;

  @ApiProperty({ example: '', description: 'Git reference' })
  ref: string;

  @ApiProperty({ example: null, description: 'Blob ID', nullable: true })
  blob_id: string | null;

  @ApiProperty({ example: null, description: 'Commit ID', nullable: true })
  commit_id: string | null;

  @ApiProperty({ example: null, description: 'Last commit ID', nullable: true })
  last_commit_id: string | null;
}

export class FileErrorDto {
  @ApiProperty({ example: 'nonexistent.txt', description: 'File path that caused error' })
  file_path: string;

  @ApiProperty({ example: 'FILE_NOT_FOUND', description: 'Error code' })
  error: string;

  @ApiProperty({ example: 'File does not exist', description: 'Error message' })
  message: string;
}

export class MultipleFilesResponseDto {
  @ApiProperty({ type: [FileInfoDto], description: 'Array of file information' })
  files: FileInfoDto[];

  @ApiProperty({ example: 1, description: 'Total number of files requested' })
  total_count: number;

  @ApiProperty({ example: 1, description: 'Number of successfully retrieved files' })
  success_count: number;

  @ApiProperty({ example: 0, description: 'Number of files that failed to retrieve' })
  error_count: number;

  @ApiProperty({ 
    type: [FileErrorDto],
    description: 'Array of error details for failed files',
    required: false
  })
  errors?: FileErrorDto[];
}

export class GetFilesResponseDto {
  @ApiProperty({ example: true, description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ type: MultipleFilesResponseDto, description: 'Response data' })
  data: MultipleFilesResponseDto;

  @ApiProperty({ example: 'Files retrieved successfully', description: 'Response message', required: false })
  message?: string;
}

export class SaveFileResultDto {
  @ApiProperty({ example: 'test.txt', description: 'File path' })
  file_path: string;

  @ApiProperty({ example: 1024, description: 'File size in bytes' })
  size: number;

  @ApiProperty({ example: 'text', description: 'Encoding used' })
  encoding: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Last modified timestamp' })
  last_modified: string;

  @ApiProperty({ example: true, description: 'Whether the file was newly created' })
  created: boolean;

  @ApiProperty({ example: 'old-file.txt', description: 'Previous file path if renamed', required: false })
  renamed_from?: string;

  @ApiProperty({ example: 'save', enum: ['save', 'rename'], description: 'Operation type', required: false })
  operation?: 'save' | 'rename';
}

export class SaveFileResponseDto {
  @ApiProperty({ example: true, description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ type: SaveFileResultDto, description: 'Save operation result' })
  data: SaveFileResultDto;

  @ApiProperty({ example: 'File saved successfully', description: 'Response message', required: false })
  message?: string;
}

export class DeleteFileResponseDto {
  @ApiProperty({ example: true, description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ example: 'File deleted successfully', description: 'Response message', required: false })
  message?: string;
}
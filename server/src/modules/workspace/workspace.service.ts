import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { WorkspaceQuery, WorkspaceResponse, WorkspaceFile, WorkspaceGroup } from '@shared/types/workspace';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class WorkspaceService {
  private readonly storageDir = this.getStorageDir();

  constructor() {}

  private getStorageDir(): string {
    if (process.env.NODE_ENV === 'production') {
      // CLI环境：使用当前工作目录
      return process.cwd();
    } else {
      // 开发环境：必须设置 STORAGE_DIR 环境变量
      if (!process.env.STORAGE_DIR) {
        throw new Error('STORAGE_DIR environment variable must be set in development mode');
      }
      return process.env.STORAGE_DIR;
    }
  }

  async getWorkspaces(query: WorkspaceQuery = {}): Promise<WorkspaceResponse> {
    try {
      const {
        limit = 100,
        include_hidden = false,
        file_types = []
      } = query;

      // Build grep command to find workspace: metadata in first 10 lines
      let grepCommand = `grep -rn "^workspace:" "${this.storageDir}"`;
      
      // Exclude hidden directories and files if not requested
      if (!include_hidden) {
        grepCommand += ' --exclude-dir=".*"';
      }
      
      // Add file type includes
      if (file_types.length > 0) {
        const includes = file_types.map(ext => `--include="*.${ext}"`).join(' ');
        grepCommand += ` ${includes}`;
      }
      
      // Limit results to prevent overwhelming output
      grepCommand += ' | head -500';

      const { stdout } = await execAsync(grepCommand, { 
        cwd: this.storageDir,
        timeout: 10000 
      });

      const lines = stdout.split('\n').filter(line => line.trim());
      const workspaceFiles: WorkspaceFile[] = [];

      for (const line of lines) {
        if (!line) continue;

        // Parse grep output: filename:line_number:content
        const match = line.match(/^([^:]+):(\d+):(.*)$/);
        if (!match) continue;

        const [, filePath, lineNumber, content] = match;
        const lineNum = parseInt(lineNumber);
        
        // Only process if the match is in the first 10 lines
        if (lineNum > 10) continue;

        // Extract workspace value from "workspace: value"
        const workspaceMatch = content.match(/^workspace:\s*(.+)$/);
        if (!workspaceMatch) continue;

        const workspace = workspaceMatch[1].trim();
        const relativePath = path.relative(this.storageDir, filePath);
        const filename = path.basename(filePath);

        workspaceFiles.push({
          path: relativePath,
          filename,
          workspace,
          line: lineNum
        });
      }

      // Group files by workspace
      const workspaceMap = new Map<string, WorkspaceFile[]>();
      
      for (const file of workspaceFiles) {
        if (!workspaceMap.has(file.workspace)) {
          workspaceMap.set(file.workspace, []);
        }
        workspaceMap.get(file.workspace)!.push(file);
      }

      // Convert to workspace groups
      const workspaces: WorkspaceGroup[] = Array.from(workspaceMap.entries())
        .map(([workspace, files]) => ({
          workspace,
          files: files.slice(0, limit), // Limit files per workspace
          count: files.length
        }))
        .sort((a, b) => b.count - a.count); // Sort by file count descending

      return {
        success: true,
        data: {
          workspaces,
          total_workspaces: workspaces.length,
          total_files: workspaceFiles.length
        }
      };

    } catch (error) {
      console.error('Error in workspace search:', error);
      return {
        success: false,
        data: {
          workspaces: [],
          total_workspaces: 0,
          total_files: 0
        },
        message: error instanceof Error ? error.message : 'Workspace search failed'
      };
    }
  }
}
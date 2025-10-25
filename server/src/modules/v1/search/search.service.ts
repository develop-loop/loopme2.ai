import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { V1Search } from '@shared/index';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class V1SearchService {
  private readonly storageDir = this.getStorageDir();
  private readonly maxResults = 20;

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

  async search(query: V1Search.SearchQuery): Promise<V1Search.SearchResponse> {
    try {
      const {
        q,
        type = 'both',
        limit = this.maxResults,
        include_hidden = false,
        file_types = []
      } = query;

      if (!q || q.trim().length === 0) {
        return {
          success: false,
          data: {
            results: [],
            total_count: 0,
            query: q,
            search_type: type
          },
          message: 'Search query is required'
        };
      }

      const results: V1Search.SearchResult[] = [];

      // Search by filename
      if (type === 'filename' || type === 'both') {
        const filenameResults = await this.searchByFilename(q, include_hidden, file_types);
        results.push(...filenameResults);
      }

      // Search by content
      if (type === 'content' || type === 'both') {
        const contentResults = await this.searchByContent(q, include_hidden, file_types);
        results.push(...contentResults);
      }

      // Sort by score (higher is better) and limit results
      results.sort((a, b) => b.score - a.score);
      const limitedResults = results.slice(0, limit);

      return {
        success: true,
        data: {
          results: limitedResults,
          total_count: results.length,
          query: q,
          search_type: type
        }
      };

    } catch (error) {
      console.error('Error in V1 search:', error);
      return {
        success: false,
        data: {
          results: [],
          total_count: 0,
          query: query.q,
          search_type: query.type || 'both'
        },
        message: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  private async searchByFilename(query: string, includeHidden: boolean, fileTypes: string[]): Promise<V1Search.SearchResult[]> {
    try {
      // Build find command
      let findCommand = `find "${this.storageDir}" -type f`;
      
      // Exclude hidden files if not requested
      if (!includeHidden) {
        findCommand += ' -not -path "*/.*"';
      }
      
      // Add file type filters
      if (fileTypes.length > 0) {
        const typeConditions = fileTypes.map(ext => `-name "*.${ext}"`).join(' -o ');
        findCommand += ` \\( ${typeConditions} \\)`;
      }
      
      // Add case-insensitive name search
      findCommand += ` -iname "*${query}*"`;
      
      // Limit results to prevent overwhelming output
      findCommand += ' | head -50';

      const { stdout } = await execAsync(findCommand, { 
        cwd: this.storageDir,
        timeout: 5000 
      });

      const files = stdout.split('\n').filter(line => line.trim());
      const results: V1Search.SearchResult[] = [];

      for (const filePath of files) {
        if (!filePath) continue;

        const relativePath = path.relative(this.storageDir, filePath);
        const filename = path.basename(filePath);
        
        // Calculate relevance score based on query match
        const score = this.calculateFilenameScore(filename, query);

        results.push({
          type: 'file',
          path: relativePath,
          filename,
          score
        });
      }

      return results;

    } catch (error) {
      console.error('Error searching by filename:', error);
      return [];
    }
  }

  private async searchByContent(query: string, includeHidden: boolean, fileTypes: string[]): Promise<V1Search.SearchResult[]> {
    try {
      // Build grep command
      let grepCommand = `grep -r -n -i`;
      
      // Exclude hidden directories and files if not requested
      if (!includeHidden) {
        grepCommand += ' --exclude-dir=".*"';
      }
      
      // Add file type includes
      if (fileTypes.length > 0) {
        const includes = fileTypes.map(ext => `--include="*.${ext}"`).join(' ');
        grepCommand += ` ${includes}`;
      }
      
      // Add the search pattern and directory
      grepCommand += ` "${query}" "${this.storageDir}"`;
      
      // Limit results
      grepCommand += ' | head -100';

      const { stdout } = await execAsync(grepCommand, { 
        cwd: this.storageDir,
        timeout: 10000 
      });

      const lines = stdout.split('\n').filter(line => line.trim());
      const results: V1Search.SearchResult[] = [];

      for (const line of lines) {
        if (!line) continue;

        // Parse grep output: filename:line_number:content
        const match = line.match(/^([^:]+):(\d+):(.*)$/);
        if (!match) continue;

        const [, filePath, lineNumber, content] = match;
        const relativePath = path.relative(this.storageDir, filePath);
        const filename = path.basename(filePath);
        
        // Extract the matched text with some context
        const matchedText = this.extractMatchedText(content, query);
        
        // Calculate relevance score
        const score = this.calculateContentScore(content, query, filename);

        results.push({
          type: 'content',
          path: relativePath,
          filename,
          line: parseInt(lineNumber),
          content: content.trim(),
          matchedText,
          score
        });
      }

      return results;

    } catch (error) {
      console.error('Error searching by content:', error);
      return [];
    }
  }

  private calculateFilenameScore(filename: string, query: string): number {
    const lowerFilename = filename.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    let score = 0;
    
    // Exact match gets highest score
    if (lowerFilename === lowerQuery) {
      score += 100;
    }
    // Starts with query gets high score
    else if (lowerFilename.startsWith(lowerQuery)) {
      score += 80;
    }
    // Contains query gets medium score
    else if (lowerFilename.includes(lowerQuery)) {
      score += 60;
    }
    
    // Shorter filenames with matches score higher
    score += Math.max(0, 50 - filename.length);
    
    return score;
  }

  private calculateContentScore(content: string, query: string, filename: string): number {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    let score = 0;
    
    // Count occurrences of query in content
    const matches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
    score += matches * 20;
    
    // Bonus for matches in filename
    if (filename.toLowerCase().includes(lowerQuery)) {
      score += 30;
    }
    
    // Bonus for exact word matches
    if (lowerContent.includes(` ${lowerQuery} `)) {
      score += 15;
    }
    
    // Penalty for very long lines
    if (content.length > 200) {
      score -= 5;
    }
    
    return score;
  }

  private extractMatchedText(content: string, query: string): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    const index = lowerContent.indexOf(lowerQuery);
    if (index === -1) return content.slice(0, 100);
    
    // Extract with context around the match
    const start = Math.max(0, index - 30);
    const end = Math.min(content.length, index + query.length + 30);
    
    let result = content.slice(start, end);
    
    // Add ellipsis if truncated
    if (start > 0) result = '...' + result;
    if (end < content.length) result = result + '...';
    
    return result;
  }
}
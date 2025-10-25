// ============================================================================
// V1 Search API Types
// ============================================================================

export interface SearchResult {
  type: 'file' | 'content';
  path: string;
  filename: string;
  line?: number;
  content?: string;
  matchedText?: string;
  score: number;
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    total_count: number;
    query: string;
    search_type: 'filename' | 'content' | 'both';
  };
  message?: string;
}

export interface SearchQuery {
  q: string; // search query
  type?: 'filename' | 'content' | 'both'; // search type
  limit?: number; // max results (default: 20)
  include_hidden?: boolean; // include hidden files (default: false)
  file_types?: string[]; // file extensions to include (e.g., ['js', 'ts', 'md'])
}
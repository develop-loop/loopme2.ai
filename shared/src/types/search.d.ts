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
    q: string;
    type?: 'filename' | 'content' | 'both';
    limit?: number;
    include_hidden?: boolean;
    file_types?: string[];
}

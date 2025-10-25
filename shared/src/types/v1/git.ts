// ============================================================================
// V1 Git API Types
// ============================================================================

export interface GitCommit {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  created_at: string;
  message: string;
  parent_ids: string[];
  web_url?: string;
}

export interface GitCommitsQuery {
  ref_name?: string;
  since?: string;
  until?: string;
  path?: string;
  author?: string;
  page?: number;
  per_page?: number;
}

export interface GitCommitsResponse {
  success: boolean;
  data: {
    commits: GitCommit[];
    total_count: number;
    page: number;
    per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  message?: string;
}

export interface GitConfigResponse {
  success: boolean;
  data?: { [key: string]: string };
  message?: string;
}
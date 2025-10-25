// Git API types following GitLab API format

export interface GitCommit {
  id: string
  short_id: string
  title: string
  message: string
  author_name: string
  author_email: string
  authored_date: string
  committer_name: string
  committer_email: string
  committed_date: string
  created_at: string
  parent_ids: string[]
  web_url?: string
}

export interface GitCommitsResponse {
  success: boolean
  data: {
    commits: GitCommit[]
    total_count: number
    page: number
    per_page: number
    total_pages: number
    has_next_page: boolean
    has_previous_page: boolean
  }
  message?: string
}

export interface GitCommitsQuery {
  page?: number
  per_page?: number
  ref_name?: string // branch name
  since?: string // ISO 8601 date
  until?: string // ISO 8601 date
  path?: string // file path to filter commits
  author?: string // author email or name
  search?: string // search in commit message
}

export interface GitStats {
  additions: number
  deletions: number
  total: number
}

export interface GitCommitWithStats extends GitCommit {
  stats?: GitStats
}
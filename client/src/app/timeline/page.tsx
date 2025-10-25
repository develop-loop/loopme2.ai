'use client'

import { useState, useEffect } from 'react'

interface GitCommit {
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
}

interface CommitsResponse {
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

export default function TimelinePage() {
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchCommits = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/commits?page=${pageNum}&per_page=10`)
      const data: CommitsResponse = await response.json()
      
      if (data.success) {
        setCommits(data.data.commits)
        setTotalPages(data.data.total_pages)
        setPage(data.data.page)
      } else {
        setError(data.message || 'Failed to load commits')
      }
    } catch (err) {
      setError('Error fetching commits')
      console.error('Error fetching commits:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommits()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading timeline...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-md bg-red-50 p-4 max-w-md">
            <div className="text-sm text-red-700">
              <p className="font-medium mb-2">Timeline Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Timeline</h1>
          <p className="text-gray-600 mt-2">Git commit history and project timeline</p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {commits.map((commit, commitIdx) => (
                  <li key={commit.id}>
                    <div className="relative pb-8">
                      {commitIdx !== commits.length - 1 ? (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                            <span className="text-white text-xs font-medium">
                              {getInitials(commit.author_name)}
                            </span>
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">{commit.author_name}</span> committed{' '}
                              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {commit.short_id}
                              </span>
                            </p>
                            <p className="mt-2 text-sm text-gray-900 font-medium">{commit.title}</p>
                            {commit.message !== commit.title && (
                              <p className="mt-1 text-sm text-gray-600">{commit.message}</p>
                            )}
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={commit.authored_date}>
                              {formatDate(commit.authored_date)}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => fetchCommits(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchCommits(page + 1)}
                  disabled={page >= totalPages}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
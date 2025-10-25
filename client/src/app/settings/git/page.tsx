'use client'

import { useState, useEffect } from 'react'

export default function GitSettingsPage() {
  const [gitStatus, setGitStatus] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [repoInfo, setRepoInfo] = useState({
    isRepo: false,
    currentBranch: '',
    totalCommits: 0
  })

  useEffect(() => {
    fetchGitInfo()
  }, [])

  const fetchGitInfo = async () => {
    try {
      setLoading(true)
      
      // Fetch commits to check if it's a git repo and get info
      const response = await fetch('/api/commits?per_page=1')
      const data = await response.json()
      
      if (data.success) {
        setRepoInfo({
          isRepo: true,
          currentBranch: 'main', // You could add this to the API later
          totalCommits: data.data.total_count
        })
        setGitStatus('Repository is properly configured')
      } else {
        setRepoInfo({
          isRepo: false,
          currentBranch: '',
          totalCommits: 0
        })
        setGitStatus(data.message || 'Not a git repository')
      }
    } catch (error) {
      console.error('Error fetching git info:', error)
      setGitStatus('Error fetching git information')
      setRepoInfo({
        isRepo: false,
        currentBranch: '',
        totalCommits: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading git settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Git Settings</h2>
        <p className="text-gray-600 mt-1">View git repository information and configuration</p>
      </div>

      {/* Git Status */}
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Repository Status</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                repoInfo.isRepo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {repoInfo.isRepo ? '✓ Git Repository' : '✗ Not a Git Repository'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{gitStatus}</p>
          </div>
        </div>

        {repoInfo.isRepo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Repository Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Repository Information</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs font-medium text-gray-500">Current Branch</dt>
                  <dd className="text-sm text-gray-900 font-mono">{repoInfo.currentBranch || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Total Commits</dt>
                  <dd className="text-sm text-gray-900">{repoInfo.totalCommits}</dd>
                </div>
              </dl>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={fetchGitInfo}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  🔄 Refresh Git Info
                </button>
                <button
                  onClick={() => window.open('/timeline', '_blank')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  📈 View Timeline
                </button>
              </div>
            </div>
          </div>
        )}

        {!repoInfo.isRepo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Git Repository Not Found
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The current directory is not a git repository. Git features will not be available until you initialize a repository or navigate to an existing one.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
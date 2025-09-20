'use client'

import { useState, useEffect, useCallback } from 'react'
import { filesService } from '../../services/FilesService'

interface SettingsConfig {
  draftPath?: string
}

export default function SettingsPage() {
  const [draftPath, setDraftPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseYAML = (yamlContent: string): SettingsConfig => {
    try {
      const lines = yamlContent.split('\n')
      const settings: SettingsConfig = {}
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('draftPath:')) {
          const value = trimmed.split('draftPath:')[1]?.trim().replace(/['"`]/g, '') || ''
          settings.draftPath = value
        }
      }
      
      return settings
    } catch (err) {
      console.error('YAML parsing error:', err)
      return {}
    }
  }

  const generateYAML = (settings: SettingsConfig): string => {
    return `# Application Settings
draftPath: "${settings.draftPath || ''}"
`
  }

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 使用新的FilesService获取设置文件
      const response = await filesService.getFile('settings.yaml')
      
      if (!response.success || response.data.error_count > 0) {
        // File doesn't exist, use default values
        setDraftPath('')
        return
      }
      
      // 获取第一个文件的内容
      const fileData = response.data.files[0]
      if (!fileData) {
        setDraftPath('')
        return
      }
      
      // Parse YAML content
      const yamlContent = fileData.encoding === 'base64' ? atob(fileData.content) : fileData.content
      const settings = parseYAML(yamlContent)
      
      setDraftPath(settings.draftPath || '')
      
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const settings: SettingsConfig = {
        draftPath: draftPath.trim()
      }
      
      const yamlContent = generateYAML(settings)
      
      // 使用新的FilesService保存设置文件
      const response = await filesService.saveFile({
        file_path: 'settings.yaml',
        content: yamlContent,
        encoding: 'text',
        commit_message: 'Update settings configuration',
        author_name: 'User',
        author_email: 'user@example.com'
      })

      if (!response.success) {
        throw new Error('Failed to save settings')
      }

      alert('Settings saved successfully!')
      
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(`Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading settings...</p>
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
              <p className="font-medium mb-2">Settings Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Configure application settings</p>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="draftPath" className="block text-sm font-medium text-gray-700 mb-2">
                  Draft Path
                </label>
                <input
                  type="text"
                  id="draftPath"
                  value={draftPath}
                  onChange={(e) => setDraftPath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter draft path (e.g., ./drafts)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Specify the directory path where draft files should be stored
                </p>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                  saving
                    ? 'text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700'
                }`}
                title={saving ? 'Saving...' : 'Save settings'}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { clientStorageService, ExploreSettings } from '../../../services/ClientStorageService'

export default function ExploreSettingsPage() {
  const [draftPath, setDraftPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(() => {
    try {
      setLoading(true)
      setError(null)
      
      // 检查localStorage是否可用
      if (!clientStorageService.isAvailable()) {
        throw new Error('Browser storage is not available')
      }
      
      // 从localStorage读取设置
      const settings = clientStorageService.getExploreSettings()
      setDraftPath(settings.draftPath)
      
    } catch (err) {
      console.error('Error loading settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSave = () => {
    try {
      setSaving(true)
      
      if (!clientStorageService.isAvailable()) {
        throw new Error('Browser storage is not available')
      }
      
      const settings: ExploreSettings = {
        draftPath: draftPath.trim() || './drafts'
      }
      
      // 保存到localStorage
      const success = clientStorageService.setExploreSettings(settings)
      
      if (!success) {
        throw new Error('Failed to save settings to browser storage')
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading explore settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="rounded-md bg-red-50 p-4 max-w-md mx-auto">
          <div className="text-sm text-red-700">
            <p className="font-medium mb-2">Settings Error</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Explore Settings</h2>
        <p className="text-gray-600 mt-1">Configure explore page and file management settings</p>
      </div>

      {/* Settings Form */}
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
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter draft path (e.g., ./drafts)"
          />
          <p className="text-sm text-gray-500 mt-1">
            Specify the directory path where draft files should be stored
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
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
  )
}
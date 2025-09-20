'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<object | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 在开发环境中，API会通过代理访问
    // 在生产环境中，需要使用实际的后端地址
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'http://localhost:7788/api/docs-json'  // 生产环境后端地址
      : '/api/docs-json'  // 开发环境通过代理

    fetch(apiUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        return res.json()
      })
      .then(setSpec)
      .catch(err => {
        console.error('Failed to load API documentation:', err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading API Documentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API Documentation</h1>
            <p className="text-gray-600">Interactive API documentation powered by Swagger</p>
          </header>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Failed to Load API Documentation</h2>
            <p className="text-red-700 mb-4">Error: {error}</p>
            
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium text-gray-900 mb-2">Alternative Access:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">Development:</span>
                  <a 
                    href="http://localhost:3001/api/docs" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    http://localhost:3001/api/docs
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">Production:</span>
                  <a 
                    href="http://localhost:7788/api/docs" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    http://localhost:7788/api/docs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-indigo-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="mt-2 text-indigo-200">
            Comprehensive documentation for LoopMe3 APIs
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        {spec && <SwaggerUI spec={spec} />}
      </div>
    </div>
  )
}
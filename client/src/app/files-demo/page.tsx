'use client';

import { useState } from 'react';
import { FilesApiClient, GetFilesResponse } from '@shared/client';

export default function FilesDemo() {
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 创建API客户端实例
  const filesApi = new FilesApiClient('/api');

  const loadFile = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 使用类型安全的API调用
      const response: GetFilesResponse = await filesApi.getFile('test.txt');
      
      if (response.success && response.data.files.length > 0) {
        setFileContent(response.data.files[0].content);
      } else {
        setError('No files found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 使用类型安全的API调用
      await filesApi.saveFile({
        file_path: 'test.txt',
        content: fileContent,
        commit_message: 'Update from web interface',
        author_name: 'Web User'
      });
      
      alert('File saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  const loadMultipleFiles = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 获取多个文件
      const response = await filesApi.getFiles({
        file_paths: ['test.txt', 'another.txt'],
        encoding: 'text'
      });
      
      console.log(`Loaded ${response.data.success_count} files:`, response.data.files);
      
      if (response.data.error_count > 0) {
        console.log('Errors:', response.data.errors);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Files API Demo</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">File Content:</label>
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
            rows={10}
            placeholder="File content will appear here..."
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={loadFile}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load File'}
          </button>
          
          <button
            onClick={saveFile}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save File'}
          </button>
          
          <button
            onClick={loadMultipleFiles}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Load Multiple Files
          </button>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Type Safety Benefits:</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• IntelliSense support for API parameters</li>
          <li>• Compile-time type checking</li>
          <li>• Consistent request/response formats</li>
          <li>• Shared types between frontend and backend</li>
        </ul>
      </div>
    </div>
  );
}
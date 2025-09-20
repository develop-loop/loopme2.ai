'use client';

import { useState } from 'react';
import { GetFilesResponse } from '@shared/client';
import { filesService } from '@/services';

export default function FilesDemo() {
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 使用新的FilesService

  const loadFile = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 使用新的FilesService - 类型安全的API调用
      const response: GetFilesResponse = await filesService.getFiles({
        file_paths: ['test.txt']
      });
      
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
      // 使用新的FilesService - 类型安全的API调用
      await filesService.saveFile({
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
      const response = await filesService.getMultipleFiles(
        ['test.txt', 'another.txt'], 
        'text'
      );
      
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
        <h2 className="text-lg font-semibold mb-2">FilesService Benefits:</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 使用shared types确保前后端类型一致性</li>
          <li>• 基于BaseApiService的统一错误处理</li>
          <li>• IntelliSense支持和编译时类型检查</li>
          <li>• 简化的API调用方法</li>
          <li>• 自动URL构建和参数处理</li>
        </ul>
      </div>
    </div>
  );
}
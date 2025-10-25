import { V1Workspace } from '@shared/index';
import { BaseApiService } from './BaseApiService';

/**
 * V1 Workspace Service - 处理所有V1工作区相关的API调用
 * 使用shared V1Workspace types确保前后端类型一致性
 */
export class V1WorkspaceService extends BaseApiService {
  constructor(baseUrl: string = '/api/v1') {
    super(baseUrl);
  }

  /**
   * 获取所有工作区和其中的文件
   */
  async getWorkspaces(request?: V1Workspace.WorkspaceQuery): Promise<V1Workspace.WorkspaceResponse> {
    try {
      const params: Record<string, string | boolean | string[]> = {};
      
      if (request?.limit) {
        params.limit = request.limit.toString();
      }
      
      if (request?.include_hidden) {
        params.include_hidden = request.include_hidden;
      }
      
      if (request?.file_types && request.file_types.length > 0) {
        params.file_types = request.file_types.join(',');
      }

      return await this.get<V1Workspace.WorkspaceResponse>('workspaces', params);
    } catch (error) {
      console.error('V1WorkspaceService.getWorkspaces error:', error);
      throw error;
    }
  }

  /**
   * 获取所有工作区（简化版本，只返回工作区名称和文件计数）
   */
  async getWorkspaceNames(): Promise<string[]> {
    try {
      const response = await this.getWorkspaces();
      if (response.success) {
        return response.data.workspaces.map(ws => ws.workspace);
      }
      return [];
    } catch (error) {
      console.error('V1WorkspaceService.getWorkspaceNames error:', error);
      return [];
    }
  }

  /**
   * 获取特定工作区的文件列表
   */
  async getWorkspaceFiles(workspaceName: string): Promise<V1Workspace.WorkspaceFile[]> {
    try {
      const response = await this.getWorkspaces();
      if (response.success) {
        const workspace = response.data.workspaces.find(ws => ws.workspace === workspaceName);
        return workspace ? workspace.files : [];
      }
      return [];
    } catch (error) {
      console.error('V1WorkspaceService.getWorkspaceFiles error:', error);
      return [];
    }
  }

  /**
   * 检查工作区是否存在
   */
  async workspaceExists(workspaceName: string): Promise<boolean> {
    try {
      const workspaceNames = await this.getWorkspaceNames();
      return workspaceNames.includes(workspaceName);
    } catch (error) {
      console.error('V1WorkspaceService.workspaceExists error:', error);
      return false;
    }
  }

  /**
   * 获取文件所属的工作区
   */
  async getFileWorkspace(filePath: string): Promise<string | null> {
    try {
      const response = await this.getWorkspaces();
      if (response.success) {
        for (const workspace of response.data.workspaces) {
          if (workspace.files.some(file => file.path === filePath)) {
            return workspace.workspace;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('V1WorkspaceService.getFileWorkspace error:', error);
      return null;
    }
  }

  /**
   * 获取工作区统计信息
   */
  async getWorkspaceStats(): Promise<{
    totalWorkspaces: number;
    totalFiles: number;
    workspaceDetails: Array<{
      name: string;
      fileCount: number;
    }>;
  }> {
    try {
      const response = await this.getWorkspaces();
      if (response.success) {
        return {
          totalWorkspaces: response.data.total_workspaces,
          totalFiles: response.data.total_files,
          workspaceDetails: response.data.workspaces.map(ws => ({
            name: ws.workspace,
            fileCount: ws.count
          }))
        };
      }
      return {
        totalWorkspaces: 0,
        totalFiles: 0,
        workspaceDetails: []
      };
    } catch (error) {
      console.error('V1WorkspaceService.getWorkspaceStats error:', error);
      return {
        totalWorkspaces: 0,
        totalFiles: 0,
        workspaceDetails: []
      };
    }
  }

  /**
   * 将V1Workspace的数据格式转换为explore页面需要的Column格式
   */
  transformToExploreColumns(workspaces: V1Workspace.WorkspaceGroup[]): Array<{
    title: string;
    cards: Array<{
      title: string;
      description?: string;
      lineCount?: number;
      badgeColor?: string;
      isFileContent?: boolean;
      fileType?: string;
      isExpanded?: boolean;
      isLoaded?: boolean;
      isLoading?: boolean;
    }>;
  }> {
    return workspaces.map(workspace => ({
      title: workspace.workspace,
      cards: workspace.files.map(file => ({
        title: file.path,
        description: undefined,
        lineCount: undefined,
        badgeColor: this.getBadgeColor(file.filename),
        isFileContent: true,
        fileType: file.filename.split('.').pop()?.toLowerCase() || 'txt',
        isExpanded: false,
        isLoaded: false,
        isLoading: false
      }))
    }));
  }

  /**
   * 根据文件扩展名获取徽章颜色
   */
  private getBadgeColor(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const colorMap: Record<string, string> = {
      'yaml': 'bg-blue-100 text-blue-800',
      'yml': 'bg-blue-100 text-blue-800',
      'json': 'bg-green-100 text-green-800',
      'md': 'bg-purple-100 text-purple-800',
      'txt': 'bg-gray-100 text-gray-800',
      'js': 'bg-yellow-100 text-yellow-800',
      'ts': 'bg-indigo-100 text-indigo-800',
      'log': 'bg-red-100 text-red-800',
      'csv': 'bg-orange-100 text-orange-800'
    };
    return colorMap[ext || ''] || 'bg-slate-100 text-slate-800';
  }
}

// 创建默认实例
export const v1WorkspaceService = new V1WorkspaceService();
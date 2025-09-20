/**
 * API错误类
 */
export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public response?: Response;

  constructor(status: number, statusText: string, message?: string, response?: Response) {
    super(message || `HTTP ${status}: ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

/**
 * API响应处理工具
 */
export class ApiUtils {
  /**
   * 处理fetch响应，检查错误并解析JSON
   */
  static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // 如果无法解析错误响应，使用默认错误信息
      }
      
      throw new ApiError(response.status, response.statusText, errorMessage, response);
    }

    try {
      return await response.json();
    } catch {
      throw new Error('Failed to parse response JSON');
    }
  }

  /**
   * 创建URLSearchParams从对象
   */
  static createSearchParams(params: Record<string, string | string[] | boolean | undefined>): URLSearchParams {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          // 对于数组，特别是file_paths，序列化为JSON字符串
          if (key === 'file_paths') {
            searchParams.append(key, JSON.stringify(value));
          } else {
            value.forEach(item => searchParams.append(key, item));
          }
        } else if (typeof value === 'boolean') {
          searchParams.append(key, value.toString());
        } else {
          searchParams.append(key, value);
        }
      }
    });
    
    return searchParams;
  }

  /**
   * 构建API URL
   */
  static buildUrl(baseUrl: string, endpoint: string, params?: Record<string, string | string[] | boolean | undefined>): string {
    // 处理相对URL的情况
    let fullUrl: string;
    
    if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
      // 绝对URL
      const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      fullUrl = new URL(endpoint, base).toString();
    } else {
      // 相对URL，直接拼接
      const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      fullUrl = `${base}${cleanEndpoint}`;
    }
    
    if (params) {
      const searchParams = this.createSearchParams(params);
      const separator = fullUrl.includes('?') ? '&' : '?';
      fullUrl = `${fullUrl}${separator}${searchParams.toString()}`;
    }
    
    return fullUrl;
  }
}

/**
 * 基础API Service类
 */
export abstract class BaseApiService {
  protected baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * 执行GET请求
   */
  protected async get<T>(endpoint: string, params?: Record<string, string | string[] | boolean | undefined>): Promise<T> {
    const url = ApiUtils.buildUrl(this.baseUrl, endpoint, params);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return ApiUtils.handleResponse<T>(response);
  }

  /**
   * 执行POST请求
   */
  protected async post<T>(endpoint: string, data?: unknown, params?: Record<string, string | string[] | boolean | undefined>): Promise<T> {
    const url = ApiUtils.buildUrl(this.baseUrl, endpoint, params);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return ApiUtils.handleResponse<T>(response);
  }

  /**
   * 执行PUT请求
   */
  protected async put<T>(endpoint: string, data?: unknown, params?: Record<string, string | string[] | boolean | undefined>): Promise<T> {
    const url = ApiUtils.buildUrl(this.baseUrl, endpoint, params);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return ApiUtils.handleResponse<T>(response);
  }

  /**
   * 执行DELETE请求
   */
  protected async delete<T>(endpoint: string, params?: Record<string, string | string[] | boolean | undefined>): Promise<T> {
    const url = ApiUtils.buildUrl(this.baseUrl, endpoint, params);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return ApiUtils.handleResponse<T>(response);
  }
}
/**
 * Client Storage Service - 封装localStorage操作
 * 提供类型安全的本地存储管理
 */

export interface ExploreSettings {
  draftPath: string
}

interface StorageData {
  exploreSettings: ExploreSettings
}

export class ClientStorageService {
  private readonly PREFIX = 'turbome_'

  /**
   * 获取完整的storage key
   */
  private getKey(key: keyof StorageData): string {
    return `${this.PREFIX}${key}`
  }

  /**
   * 安全地获取localStorage数据
   */
  private getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error)
      return null
    }
  }

  /**
   * 安全地设置localStorage数据
   */
  private setItem<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error)
      return false
    }
  }

  /**
   * 安全地移除localStorage数据
   */
  private removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error)
      return false
    }
  }

  /**
   * 获取Explore设置
   */
  getExploreSettings(): ExploreSettings {
    const settings = this.getItem<ExploreSettings>(this.getKey('exploreSettings'))
    return settings || {
      draftPath: './drafts' // 默认值
    }
  }

  /**
   * 保存Explore设置
   */
  setExploreSettings(settings: ExploreSettings): boolean {
    return this.setItem(this.getKey('exploreSettings'), settings)
  }

  /**
   * 重置Explore设置为默认值
   */
  resetExploreSettings(): boolean {
    return this.removeItem(this.getKey('exploreSettings'))
  }

  /**
   * 检查localStorage是否可用
   */
  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * 清理所有turbome相关的数据
   */
  clearAll(): boolean {
    try {
      const keysToRemove: string[] = []
      
      // 找到所有以PREFIX开头的key
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.PREFIX)) {
          keysToRemove.push(key)
        }
      }
      
      // 删除所有找到的key
      keysToRemove.forEach(key => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }

  /**
   * 获取所有存储的数据（用于调试）
   */
  getAllData(): Partial<StorageData> {
    return {
      exploreSettings: this.getExploreSettings()
    }
  }
}

// 创建默认实例
export const clientStorageService = new ClientStorageService()
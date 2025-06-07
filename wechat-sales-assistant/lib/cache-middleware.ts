interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>()

  set(key: string, data: any, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // 清理过期的缓存项
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// 全局缓存实例
const cache = new SimpleCache()

// 定期清理过期缓存
if (typeof window === 'undefined') { // 只在服务端运行
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000) // 每5分钟清理一次
}

export interface CacheOptions {
  ttl?: number // 缓存时间(毫秒)
  key?: string // 自定义缓存key
  bypass?: boolean // 跳过缓存
}

/**
 * API 缓存装饰器
 * 使用方法：
 * const result = await withCache('user-info', () => fetchUserInfo(), { ttl: 30000 })
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 60000, bypass = false } = options

  // 如果设置了跳过缓存，直接执行函数
  if (bypass) {
    return await fetchFn()
  }

  // 尝试从缓存获取
  const cached = cache.get(key)
  if (cached !== null) {
    console.log(`🎯 缓存命中: ${key}`)
    return cached
  }

  // 缓存未命中，执行函数并缓存结果
  console.log(`🔄 缓存未命中，正在获取: ${key}`)
  try {
    const result = await fetchFn()
    cache.set(key, result, ttl)
    return result
  } catch (error) {
    // 如果请求失败，不缓存错误结果
    console.error(`❌ 获取数据失败: ${key}`, error)
    throw error
  }
}

/**
 * 用户相关数据缓存工具
 */
export const userCache = {
  getUserInfo: (userId: string) => 
    withCache(`user-${userId}`, () => fetchUserFromAPI(userId), { ttl: 5 * 60 * 1000 }),
  
  getUserStats: (userId: string) =>
    withCache(`user-stats-${userId}`, () => fetchUserStatsFromAPI(userId), { ttl: 2 * 60 * 1000 }),
  
  clearUser: (userId: string) => {
    cache.delete(`user-${userId}`)
    cache.delete(`user-stats-${userId}`)
  }
}

/**
 * 系统数据缓存工具
 */
export const systemCache = {
  getSystemStats: () =>
    withCache('system-stats', () => fetchSystemStatsFromAPI(), { ttl: 30 * 1000 }),
  
  getActiveConversations: () =>
    withCache('active-conversations', () => fetchActiveConversationsFromAPI(), { ttl: 15 * 1000 }),
  
  clearAll: () => {
    cache.delete('system-stats')
    cache.delete('active-conversations')
  }
}

// 这些函数需要您根据实际API进行实现
async function fetchUserFromAPI(userId: string): Promise<any> {
  // 实现具体的用户信息获取逻辑
  // const response = await fetch(`/api/users/${userId}`)
  // return response.json()
  throw new Error('fetchUserFromAPI needs to be implemented')
}

async function fetchUserStatsFromAPI(userId: string): Promise<any> {
  // 实现具体的用户统计获取逻辑
  throw new Error('fetchUserStatsFromAPI needs to be implemented')
}

async function fetchSystemStatsFromAPI(): Promise<any> {
  // 实现具体的系统统计获取逻辑
  throw new Error('fetchSystemStatsFromAPI needs to be implemented')
}

async function fetchActiveConversationsFromAPI(): Promise<any> {
  // 实现具体的活跃对话获取逻辑
  throw new Error('fetchActiveConversationsFromAPI needs to be implemented')
}

export { cache } 
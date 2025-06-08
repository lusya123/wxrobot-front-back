import { getApiUrl, API_CONFIG } from './config'
import { getAuthHeaders, handleApiResponse, type ApiResponse, type User, type UserRole } from './auth'

// 用户相关接口
export interface CreateUserRequest {
  username: string
  phone: string
  password: string
  role: UserRole
  full_name?: string
}

export interface UpdateUserRequest {
  username?: string
  phone?: string
  password?: string
  role?: UserRole
  is_active?: boolean
  full_name?: string
}

export interface UsersListResponse {
  data: User[]
  count: number
}

export interface ResetPasswordRequest {
  user_id: string
  new_password: string
}

/**
 * 用户管理API客户端
 */
export class UserApiClient {
  
  /**
   * 获取用户列表
   */
  static async getUsers(skip = 0, limit = 100): Promise<UsersListResponse> {
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.USERS)}?skip=${skip}&limit=${limit}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('需要管理员权限')
      }
      throw new Error(`获取用户列表失败: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 创建用户
   */
  static async createUser(userData: CreateUserRequest): Promise<User> {
    // 确保URL末尾有斜杠以避免重定向
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.USERS)}/`
    
    // 添加调试信息
    console.log('创建用户请求URL:', url)
    console.log('创建用户请求数据:', userData)
    console.log('请求头:', getAuthHeaders())
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('需要管理员权限')
      }
      if (response.status === 400 || response.status === 422) {
        try {
          const errorData = await response.json()
          console.error('创建用户验证错误:', errorData)
          
          // 处理不同类型的错误
          if (errorData.detail) {
            // 如果是pydantic验证错误（数组格式）
            if (Array.isArray(errorData.detail)) {
              const errors = errorData.detail.map((err: any) => {
                const field = err.loc?.slice(1).join('.')  // 跳过'body'前缀
                const message = err.msg
                return `${field}: ${message}`
              }).join('; ')
              throw new Error(`数据验证失败: ${errors}`)
            }
            // 如果是字符串格式的错误
            if (typeof errorData.detail === 'string') {
              throw new Error(`创建用户失败: ${errorData.detail}`)
            }
          }
          
          throw new Error('创建用户失败：请检查输入数据')
        } catch (jsonError) {
          console.error('解析错误响应失败:', jsonError)
          throw new Error(`创建用户失败: ${response.statusText}`)
        }
      }
      throw new Error(`创建用户失败: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 更新用户信息
   */
  static async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.USERS)}/${userId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('需要管理员权限')
      }
      if (response.status === 404) {
        throw new Error('用户不存在')
      }
      if (response.status === 400) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '更新用户失败：请检查输入数据')
      }
      throw new Error(`更新用户失败: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 删除用户
   */
  static async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.USERS)}/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('需要管理员权限')
      }
      if (response.status === 404) {
        throw new Error('用户不存在')
      }
      if (response.status === 403) {
        throw new Error('不能删除自己的账户')
      }
      throw new Error(`删除用户失败: ${response.statusText}`)
    }
  }

  /**
   * 获取单个用户信息
   */
  static async getUser(userId: string): Promise<User> {
    const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.USERS)}/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('需要管理员权限')
      }
      if (response.status === 404) {
        throw new Error('用户不存在')
      }
      throw new Error(`获取用户信息失败: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 重置用户密码
   */
  static async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.USERS)}/${userId}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_password: newPassword }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('需要管理员权限')
      }
      if (response.status === 404) {
        throw new Error('用户不存在')
      }
      throw new Error(`重置密码失败: ${response.statusText}`)
    }
  }
}

/**
 * 简化的API调用函数
 */
export const userApi = {
  list: UserApiClient.getUsers,
  create: UserApiClient.createUser,
  update: UserApiClient.updateUser,
  delete: UserApiClient.deleteUser,
  get: UserApiClient.getUser,
  resetPassword: UserApiClient.resetUserPassword,
} 
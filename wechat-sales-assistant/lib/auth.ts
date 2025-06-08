'use client'

import { API_CONFIG, getApiUrl } from './config'

// 用户角色类型
export type UserRole = 'super_admin' | 'admin' | 'user'

// 用户接口
export interface User {
  id: string
  username: string
  phone: string
  role: UserRole
  full_name?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
}

// API响应接口
export interface ApiResponse<T = any> {
  error: number
  body: T
  message: string
}

// 登录请求接口
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应接口
export interface LoginResponse {
  error: number
  body: {
    token: string
    user: User
  }
  message: string
}

// 登录凭据接口
export interface LoginCredentials {
  username: string
  password: string
}

// 处理API响应的通用函数
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (response.error === 0) {
    return response.body
  } else if (response.error === 401) {
    console.error('需要登录:', response.message)
    // 跳转到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('需要登录')
  } else if (response.error === 500) {
    console.error('系统异常:', response.message)
    alert('系统异常，请稍后再试或联系管理员。')
    throw new Error(response.message || '系统异常')
  } else {
    console.warn('业务异常:', response.message)
    alert(response.message)
    throw new Error(response.message)
  }
}

// 本地存储的键名
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'user_info'

// 获取存储的token
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

// 存储token
export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

// 清除token
export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// 获取存储的用户信息
export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  }
  return null
}

// 存储用户信息
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// 检查是否已登录
export function isAuthenticated(): boolean {
  return getToken() !== null
}

// 检查用户是否有特定角色
export function hasRole(requiredRole: UserRole | UserRole[]): boolean {
  const user = getUser()
  if (!user) return false
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(user.role)
}

// 检查用户是否是管理员（超级管理员或普通管理员）
export function isAdmin(): boolean {
  return hasRole(['super_admin', 'admin'])
}

// 检查用户是否是超级管理员
export function isSuperAdmin(): boolean {
  return hasRole('super_admin')
}

// API请求配置
export function getAuthHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// 获取当前用户信息（从API）
export async function getCurrentUser(): Promise<User> {
  const token = getToken()
  if (!token) {
    // 清除可能存在的过期用户信息
    clearToken()
    throw new Error('No authentication token')
  }

  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USER_ME), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 401) {
      // Token已过期或无效，清除本地存储
      clearToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Authentication token expired')
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const user: User = await response.json()
    
    // 更新本地存储的用户信息
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
    
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    
    // 如果是网络错误，但token存在，尝试返回本地存储的用户信息
    if (token && error instanceof Error && error.message.includes('fetch')) {
      const localUser = getUser()
      if (localUser) {
        console.warn('使用本地缓存的用户信息')
        return localUser
      }
    }
    
    throw error
  }
}

// 登录函数
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: LoginResponse = await response.json()
    
    // 如果登录成功，保存token到localStorage
    if (data.error === 0 && data.body.token) {
      localStorage.setItem(TOKEN_KEY, data.body.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.body.user))
    }
    
    return data
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

// 登出函数
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
} 
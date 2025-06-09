import { getApiUrl, API_CONFIG } from './config'
import { getAuthHeaders } from './auth'

// 类型定义
export type BotStatus = 'logged_out' | 'scanning' | 'logged_in' | 'error'
export type ToneStyle = 'professional' | 'friendly' | 'cute' | 'efficient' | 'custom'
export type ListenModePrivate = 'all' | 'none'
export type ListenModeGroup = 'none' | 'all' | 'specified'
export type LearningScope = 'all' | 'marked'
export type LearningMode = 'auto' | 'manual_approval'
export type UnhandledQuestionAction = 'reply_text' | 'escalate'
export type ChatType = 'group' | 'private'

export interface WechatBot {
  id: number
  name: string
  owner_id: string
  owner_name?: string
  created_by_me?: boolean
  creator_type?: 'self' | 'subordinate' | 'other'
  wxid?: string
  avatar?: string
  status: BotStatus
  created_at: string
  updated_at: string
}

export interface MonitoredChatInfo {
  chat_id: string
  chat_type: ChatType
}

export interface KnowledgeBaseInfo {
  kb_id: number
  name: string
  priority: number
}

export interface RecipientInfo {
  user_id: string
  name: string
}

export interface BotConfig {
  id: number
  bot_id: number
  
  // Tab 1: 身份与角色
  role_description?: string
  tone_style: ToneStyle
  system_prompt?: string
  responsible_wxid?: string  // 负责人微信ID
  
  // Tab 2: 行为与触发
  is_active_on_work_time: boolean
  work_time_start?: string
  work_time_end?: string
  offline_reply_message?: string
  auto_accept_friend_request: boolean
  friend_request_keyword_filter?: string
  friend_request_welcome_message?: string
  listen_mode_private_chat: ListenModePrivate
  listen_mode_group_chat: ListenModeGroup
  reply_trigger_on_mention: boolean
  reply_trigger_words?: string
  welcome_new_group_member: boolean
  new_member_welcome_message?: string
  
  // Tab 3: 智能与知识
  main_ai_model_id?: number
  main_ai_model_params?: Record<string, any>
  enable_auto_learning: boolean
  learning_scope: LearningScope
  learning_mode: LearningMode
  unhandled_question_action: UnhandledQuestionAction
  unhandled_question_reply_text?: string
  
  // Tab 4: 协作与提醒
  escalation_failed_attempts_trigger?: number
  escalation_trigger_intent_description?: string
  alert_trigger_intent_description?: string
  max_replies_per_minute?: number
  
  // 关联数据
  monitored_chats: MonitoredChatInfo[]
  knowledge_bases: KnowledgeBaseInfo[]
  alert_recipients: RecipientInfo[]
  escalation_recipients: RecipientInfo[]
}

export interface WechatBotWithConfig extends WechatBot {
  config?: BotConfig
}

export interface WechatBotsResponse {
  error: number
  message: string
  body: {
    data: WechatBot[]
    total: number
  }
}

export interface CreateWechatBotRequest {
  name: string
}

export interface UpdateWechatBotConfigRequest extends Partial<Omit<BotConfig, 'id' | 'bot_id'>> {
  name?: string
}

export interface OperationResponse {
  error: number
  message: string
  body?: any
}

export interface LoginResponse {
  qrcode: string
  status_check_token: string
}

/**
 * 微信账号管理API客户端
 */
export class WechatAccountApiClient {
  
  /**
   * 获取微信机器人列表
   */
  static async getBots(skip = 0, limit = 100): Promise<WechatBotsResponse> {
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.WECHAT_ACCOUNTS)}?skip=${skip}&limit=${limit}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`获取机器人列表失败: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 获取单个机器人完整配置
   */
  static async getBot(botId: number): Promise<WechatBotWithConfig> {
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.WECHAT_ACCOUNTS)}/${botId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`获取机器人信息失败: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 创建新的微信机器人
   */
  static async createBot(data: CreateWechatBotRequest): Promise<WechatBot> {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.WECHAT_ACCOUNTS)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || `创建机器人失败: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 更新机器人配置
   */
  static async updateBot(botId: number, data: UpdateWechatBotConfigRequest): Promise<OperationResponse> {
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.WECHAT_ACCOUNTS)}/${botId}`
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || `更新机器人失败: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 删除机器人
   */
  static async deleteBot(botId: number): Promise<OperationResponse> {
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.WECHAT_ACCOUNTS)}/${botId}`
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || `删除机器人失败: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * 机器人登录
   */
  static async loginBot(botId: number): Promise<LoginResponse> {
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.WECHAT_ACCOUNTS)}/${botId}/login`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || `登录机器人失败: ${response.statusText}`)
    }

    const result: OperationResponse = await response.json()
    return result.body
  }

  /**
   * 机器人登出
   */
  static async logoutBot(botId: number): Promise<OperationResponse> {
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.WECHAT_ACCOUNTS)}/${botId}/logout`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || `登出机器人失败: ${response.statusText}`)
    }

    return await response.json()
  }
}

/**
 * 简化的API调用函数
 */
export const wechatAccountApi = {
  list: WechatAccountApiClient.getBots,
  get: WechatAccountApiClient.getBot,
  create: WechatAccountApiClient.createBot,
  update: WechatAccountApiClient.updateBot,
  delete: WechatAccountApiClient.deleteBot,
  login: WechatAccountApiClient.loginBot,
  logout: WechatAccountApiClient.logoutBot,
} 
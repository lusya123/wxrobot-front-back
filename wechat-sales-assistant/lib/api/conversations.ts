import { getApiUrl } from '../config'
import { getAuthHeaders } from '../auth'

// 类型定义
export interface Conversation {
  id: number
  wechat_bot_id: number
  external_id: string
  type: 'private' | 'group'
  topic: string
  avatar?: string
  last_message?: string
  last_message_summary?: string
  last_message_at?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  sender: Contact
  external_message_id?: string
  type: 'text' | 'image' | 'file' | 'link' | 'audio' | 'video' | 'unsupported'
  content?: string
  created_at: string
}

export interface Contact {
  id: number
  wxid: string
  wx_name?: string
  remark_name?: string
  avatar?: string
  group_name?: string
  notes?: string
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  owner_id?: string
  created_at: string
  updated_at: string
}

export interface ConversationDetail {
  type: 'contact' | 'conversation'
  details: {
    id: number
    wxid?: string
    name?: string
    remark_name?: string
    avatar?: string
    tags?: string[]
    group?: string
    notes?: string
    topic?: string
    participants?: Array<{
      id: number
      wxid: string
      name: string
      avatar?: string
    }>
  }
}

export interface AISuggestion {
  suggestion: string
  memory_summary?: string
}

// API响应接口
interface ApiResponse<T> {
  error: number
  body: T
  message: string
}

// 通用的API调用函数
async function apiCall<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(getApiUrl(endpoint), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }

  const result: ApiResponse<T> = await response.json()

  if (result.error !== 0) {
    throw new Error(result.message || 'API call failed')
  }

  return result.body
}

// API 函数
export const conversationsApi = {
  // 获取会话列表
  async getConversations(wechatAccountId: number, query?: string) {
    return apiCall<{ conversations: Conversation[] }>('/api/v1/conversations/list', {
      wechat_account_id: wechatAccountId,
      query
    })
  },

  // 获取消息列表
  async getMessages(conversationId: number, page: number = 1, pageSize: number = 20) {
    return apiCall<{ messages: Message[], total: number }>('/api/v1/conversations/messages/list', {
      conversation_id: conversationId,
      page,
      page_size: pageSize
    })
  },

  // 获取会话详情
  async getConversationDetails(conversationId: number, contactId?: number) {
    return apiCall<ConversationDetail>('/api/v1/conversations/details/get', {
      conversation_id: conversationId,
      contact_id: contactId
    })
  },

  // 更新联系人信息
  async updateContact(contactId: number, data: {
    tags?: string[]
    group?: string
    notes?: string
  }) {
    return apiCall<{ status: string }>('/api/v1/conversations/contacts/update', {
      contact_id: contactId,
      ...data
    })
  },

  // 获取AI建议
  async getAISuggestion(conversationId: number, contactId: number) {
    return apiCall<AISuggestion>('/api/v1/conversations/ai/suggestion', {
      conversation_id: conversationId,
      contact_id: contactId
    })
  },

  // 获取标签列表
  async getTags() {
    return apiCall<{ tags: Tag[] }>('/api/v1/conversations/tags/list', {})
  },

  // 创建标签
  async createTag(name: string) {
    return apiCall<Tag>('/api/v1/conversations/tags/create', { name })
  }
} 
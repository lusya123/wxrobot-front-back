"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { conversationsApi, type Conversation } from "@/lib/api/conversations"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface ConversationListProps {
  selectedId: number | null
  onSelect: (id: number) => void
  wechatAccountId?: number
  searchQuery?: string
}

export function ConversationList({ selectedId, onSelect, wechatAccountId = 1, searchQuery }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [wechatAccountId, searchQuery])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const result = await conversationsApi.getConversations(wechatAccountId, searchQuery)
      setConversations(result.conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return format(date, 'HH:mm')
    } else if (diffInDays === 1) {
      return '昨天'
    } else if (diffInDays < 7) {
      return format(date, 'EEEE', { locale: zhCN })
    } else {
      return format(date, 'MM-dd')
    }
  }

  const getDisplayName = (conversation: Conversation) => {
    // 如果是私聊，尝试获取对方的名称
    return conversation.topic || conversation.external_id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        暂无会话
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conversation, index) => (
        <motion.div
          key={conversation.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={cn(
            "flex items-start p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors",
            selectedId === conversation.id && "bg-muted/70",
          )}
          onClick={() => onSelect(conversation.id)}
        >
          <Avatar className="h-10 w-10 mr-4 mt-1">
            <AvatarImage src={conversation.avatar || "/placeholder.svg"} alt={getDisplayName(conversation)} />
            <AvatarFallback>{getDisplayName(conversation).slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h4 className="text-sm font-semibold">{getDisplayName(conversation)}</h4>
                {conversation.type === 'group' && (
                  <Badge variant="secondary" className="ml-2 text-xs">群聊</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{formatTime(conversation.last_message_at)}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {conversation.type === 'private' ? '私聊' : '群聊'}
            </p>
            <p className="text-sm truncate mt-1">{conversation.last_message_summary || '暂无消息'}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

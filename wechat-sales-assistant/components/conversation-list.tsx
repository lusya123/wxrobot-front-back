"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

interface ConversationListProps {
  selectedId: number | null
  onSelect: (id: number) => void
}

const conversations = [
  {
    id: 1,
    customer: {
      name: "李先生",
      company: "ABC科技有限公司",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    lastMessage: "我想了解一下你们的产品价格",
    time: "11:45",
    unread: 2,
    status: "pending",
    isActive: true,
  },
  {
    id: 2,
    customer: {
      name: "王总",
      company: "未来传媒集团",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    lastMessage: "好的，我明天有时间，可以安排一个演示",
    time: "11:30",
    unread: 0,
    status: "active",
    isActive: false,
  },
  {
    id: 3,
    customer: {
      name: "赵女士",
      company: "智慧教育科技",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    lastMessage: "这个功能确实很适合我们公司的需求",
    time: "10:15",
    unread: 0,
    status: "human",
    isActive: false,
  },
  {
    id: 4,
    customer: {
      name: "陈先生",
      company: "环球贸易有限公司",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    lastMessage: "价格有点超出我的预算，有没有其他方案",
    time: "昨天",
    unread: 0,
    status: "closed",
    isActive: false,
  },
  {
    id: 5,
    customer: {
      name: "刘经理",
      company: "新星科技",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    lastMessage: "谢谢，我收到资料了，会仔细看看",
    time: "昨天",
    unread: 0,
    status: "active",
    isActive: false,
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">AI对话中</Badge>
    case "pending":
      return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-0">待接管</Badge>
    case "human":
      return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">人工接管</Badge>
    case "closed":
      return <Badge className="bg-gray-50 text-gray-700 hover:bg-gray-100 border-0">已结束</Badge>
    default:
      return null
  }
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="flex flex-col">
      {conversations.map((conversation) => (
        <motion.div
          key={conversation.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: conversation.id * 0.05 }}
          className={cn(
            "flex items-start p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors",
            selectedId === conversation.id && "bg-muted/70",
          )}
          onClick={() => onSelect(conversation.id)}
        >
          <Avatar className="h-10 w-10 mr-4 mt-1">
            <AvatarImage src={conversation.customer.avatar || "/placeholder.svg"} alt={conversation.customer.name} />
            <AvatarFallback>{conversation.customer.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h4 className="text-sm font-semibold">{conversation.customer.name}</h4>
                {conversation.unread > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conversation.unread}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{conversation.time}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{conversation.customer.company}</p>
            <p className="text-sm truncate mt-1">{conversation.lastMessage}</p>
            <div className="mt-2">{getStatusBadge(conversation.status)}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

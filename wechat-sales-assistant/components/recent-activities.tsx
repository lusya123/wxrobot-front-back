import { cn } from "@/lib/utils"
import { MessageSquare, UserPlus, Calendar, BookOpen, UserCheck } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "takeover",
    user: "张经理",
    customer: "李先生",
    time: "11:45",
    description: "接管了与李先生的对话",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 2,
    type: "new_customer",
    user: "AI助手",
    customer: "王总",
    time: "11:30",
    description: "新增客户：王总（ABC公司）",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 3,
    type: "appointment",
    user: "AI助手",
    customer: "赵女士",
    time: "10:15",
    description: "为赵女士预约了产品演示",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 4,
    type: "knowledge",
    user: "刘经理",
    customer: "",
    time: "09:22",
    description: "更新了产品知识库",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 5,
    type: "takeover",
    user: "王经理",
    customer: "陈先生",
    time: "昨天",
    description: "接管了与陈先生的对话",
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case "takeover":
      return <UserCheck className="h-4 w-4 text-blue-500" />
    case "new_customer":
      return <UserPlus className="h-4 w-4 text-green-500" />
    case "appointment":
      return <Calendar className="h-4 w-4 text-purple-500" />
    case "knowledge":
      return <BookOpen className="h-4 w-4 text-amber-500" />
    default:
      return <MessageSquare className="h-4 w-4 text-gray-500" />
  }
}

export function RecentActivities() {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={activity.id}
          className={cn(
            "flex items-center hover:bg-muted/30 p-3 rounded-lg transition-colors cursor-pointer",
            index === 0 && "animate-fade-in",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
            {getActivityIcon(activity.type)}
          </div>
          <div className="ml-3 space-y-1 flex-1">
            <p className="text-sm font-medium leading-none">{activity.user}</p>
            <p className="text-xs text-muted-foreground">{activity.description}</p>
          </div>
          <div className="ml-auto text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
            {activity.time}
          </div>
        </div>
      ))}
    </div>
  )
}

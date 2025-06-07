"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { UserCircle, Bot, Send, Phone, FileText, Tag, Clock, Paperclip, Smile, MoreHorizontal } from "lucide-react"
import { motion } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ConversationDetailProps {
  conversationId: number
}

const messages = [
  {
    id: 1,
    sender: "customer",
    content: "你好，我想了解一下你们的产品",
    time: "11:30",
  },
  {
    id: 2,
    sender: "ai",
    content:
      "您好！很高兴为您服务。我是智能销售助手，可以为您介绍我们的产品和服务。请问您对哪方面的产品感兴趣呢？我们有智能客服系统、销售管理平台和数据分析工具等多种产品。",
    time: "11:30",
  },
  {
    id: 3,
    sender: "customer",
    content: "我对销售管理平台比较感兴趣，主要功能有哪些？",
    time: "11:32",
  },
  {
    id: 4,
    sender: "ai",
    content:
      "我们的销售管理平台主要功能包括：\n\n1. 客户管理：跟踪所有客户信息和互动历史\n2. 销售漏斗：可视化展示销售流程各阶段的客户数量\n3. 任务管理：为销售团队分配和跟踪任务\n4. 数据分析：提供销售业绩和转化率等关键指标分析\n5. 自动化工作流：减少重复性工作，提高效率\n\n您的团队规模大概是多少人？这样我可以为您推荐最合适的方案。",
    time: "11:33",
  },
  {
    id: 5,
    sender: "customer",
    content: "我们公司大概有20人的销售团队，价格是怎么算的？",
    time: "11:35",
  },
  {
    id: 6,
    sender: "ai",
    content:
      "对于20人的销售团队，我们有两种定价方案可供选择：\n\n1. 标准版：每用户每月98元，包含基础的客户管理、销售漏斗和任务管理功能\n\n2. 专业版：每用户每月198元，除了标准版的所有功能外，还包括高级数据分析、自动化工作流和API集成\n\n两个版本都提供免费的技术支持和培训。您更倾向于哪种方案呢？或者您有特定的预算考虑吗？",
    time: "11:36",
  },
  {
    id: 7,
    sender: "customer",
    content: "这个价格有点超出我的预算，能详细说明一下专业版比标准版多哪些功能吗？值得多付这个钱吗？",
    time: "11:40",
  },
  {
    id: 8,
    sender: "ai",
    content:
      "我理解您对预算的考虑。专业版比标准版增加的核心价值主要体现在以下几个方面：\n\n1. 高级数据分析：包含预测分析功能，可以预测销售趋势和客户行为，帮助您做出更明智的决策\n\n2. 自动化工作流：可以设置触发条件自动执行任务，如客户跟进提醒、邮件发送等，大幅节省人力成本\n\n3. API集成：可与您现有的CRM、ERP等系统无缝集成，避免数据孤岛\n\n4. 自定义报表：根据您的业务需求定制专属报表\n\n5. 高级权限管理：更精细的角色和权限控制\n\n根据我们的客户反馈，专业版平均可以为每位销售人员每月节省8-10小时的工作时间，提高15-20%的成单率。如果按照您20人的团队规模计算，每月额外投入2000元，可能带来的收益是相当可观的。\n\n不过，我们也理解每个企业情况不同。如果您希望先尝试基础功能，也可以从标准版开始，之后随时可以升级。或者，我们可以为您安排一个定制化的演示，更直观地展示两个版本的区别？",
    time: "11:42",
  },
  {
    id: 9,
    sender: "customer",
    content: "好的，我想先安排一个演示，看看具体的功能再做决定。另外，你们有没有什么优惠政策？",
    time: "11:45",
  },
]

const customerInfo = {
  name: "李先生",
  company: "ABC科技有限公司",
  position: "销售总监",
  phone: "138****5678",
  source: "LinkedIn广告",
  firstContact: "2025-05-13",
  tags: ["高意向", "预算敏感", "决策者"],
  avatar: "/placeholder.svg?height=80&width=80",
}

export function ConversationDetail({ conversationId }: ConversationDetailProps) {
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    setNewMessage("")
    // 模拟发送消息逻辑
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
    }, 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-background/80 backdrop-blur-sm flex justify-between items-center">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3 ring-2 ring-background">
            <AvatarImage src={customerInfo.avatar || "/placeholder.svg"} alt={customerInfo.name} />
            <AvatarFallback>{customerInfo.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              <h2 className="text-base font-semibold">{customerInfo.name}</h2>
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border-0">
                待接管
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {customerInfo.company} - {customerInfo.position}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="default" className="shadow-sm">
            接管对话
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Phone className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>添加备注</DropdownMenuItem>
              <DropdownMenuItem>转发对话</DropdownMenuItem>
              <DropdownMenuItem>结束对话</DropdownMenuItem>
              <DropdownMenuItem>导出记录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${message.sender === "customer" ? "justify-end" : "justify-start"}`}
              >
                {message.sender === "ai" && (
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender === "customer"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70 backdrop-blur-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70 text-right">{message.time}</p>
                </div>
                {message.sender === "customer" && (
                  <Avatar className="h-8 w-8 ml-2 mt-1">
                    <AvatarImage src={customerInfo.avatar || "/placeholder.svg"} alt={customerInfo.name} />
                    <AvatarFallback>{customerInfo.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <Avatar className="h-8 w-8 mr-2 mt-1">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted/70 backdrop-blur-sm rounded-lg p-3 max-w-[70%]">
                  <div className="flex space-x-1">
                    <div
                      className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" className="shrink-0 h-10 w-10">
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="relative flex-1">
                <Input
                  placeholder="输入消息..."
                  className="pr-10 h-10"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full">
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <Button type="submit" className="shrink-0 h-10" onClick={handleSendMessage}>
                <Send className="h-4 w-4 mr-2" />
                发送
              </Button>
            </div>
          </div>
        </div>
        <div className="w-72 border-l overflow-y-auto bg-background/50 backdrop-blur-sm">
          <Tabs defaultValue="info" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b bg-transparent justify-start px-4 pt-4">
              <TabsTrigger value="info" className="data-[state=active]:bg-muted/50">
                客户信息
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-muted/50">
                备注
              </TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4 p-4 flex-1 overflow-y-auto">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center">
                    <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium">基本信息</span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">姓名:</span>
                    <span>{customerInfo.name}</span>
                    <span className="text-muted-foreground">公司:</span>
                    <span>{customerInfo.company}</span>
                    <span className="text-muted-foreground">职位:</span>
                    <span>{customerInfo.position}</span>
                    <span className="text-muted-foreground">电话:</span>
                    <span>{customerInfo.phone}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium">来源信息</span>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">来源:</span>
                    <span>{customerInfo.source}</span>
                    <span className="text-muted-foreground">首次接触:</span>
                    <span>{customerInfo.firstContact}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium">标签</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customerInfo.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-muted/50 text-foreground/70 border-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium">活动记录</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>首次对话</span>
                      <span className="text-muted-foreground">2025-05-13 09:15</span>
                    </div>
                    <div className="flex justify-between">
                      <span>查看了产品介绍</span>
                      <span className="text-muted-foreground">2025-05-13 10:30</span>
                    </div>
                    <div className="flex justify-between">
                      <span>当前对话</span>
                      <span className="text-muted-foreground">2025-05-14 11:30</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes">
              <div className="space-y-4 p-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">暂无备注</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

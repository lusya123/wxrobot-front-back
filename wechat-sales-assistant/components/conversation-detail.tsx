"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { UserCircle, Bot, Send, Phone, FileText, Tag, Clock, Paperclip, Smile, MoreHorizontal, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { conversationsApi, type Message, type ConversationDetail } from "@/lib/api/conversations"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Textarea } from "@/components/ui/textarea"

interface ConversationDetailProps {
  conversationId: number
}

export function ConversationDetail({ conversationId }: ConversationDetailProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [conversationDetail, setConversationDetail] = useState<ConversationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [editingNotes, setEditingNotes] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversationDetails()
    loadMessages()
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversationDetails = async () => {
    try {
      const details = await conversationsApi.getConversationDetails(conversationId)
      setConversationDetail(details)
      if (details.details.tags) {
        setTags(details.details.tags)
      }
      if (details.details.notes) {
        setNotes(details.details.notes)
      }
    } catch (error) {
      console.error('Failed to load conversation details:', error)
    }
  }

  const loadMessages = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      
      const result = await conversationsApi.getMessages(conversationId, loadMore ? page + 1 : 1)
      
      if (loadMore) {
        setMessages(prev => [...result.messages, ...prev])
        setPage(page + 1)
      } else {
        setMessages(result.messages)
      }
      
      setHasMore(result.messages.length === 20)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    if (element.scrollTop === 0 && hasMore && !loadingMore) {
      loadMessages(true)
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    setNewMessage("")
    // TODO: 实现发送消息的API调用
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
    }, 2000)
  }

  const handleGetAISuggestion = async () => {
    if (!conversationDetail || conversationDetail.type !== 'contact') return
    
    try {
      const suggestion = await conversationsApi.getAISuggestion(
        conversationId,
        conversationDetail.details.id
      )
      setNewMessage(suggestion.suggestion)
    } catch (error) {
      console.error('Failed to get AI suggestion:', error)
    }
  }

  const handleUpdateNotes = async () => {
    if (!conversationDetail || conversationDetail.type !== 'contact') return
    
    try {
      await conversationsApi.updateContact(conversationDetail.details.id, {
        notes: notes,
        tags: tags
      })
      setEditingNotes(false)
    } catch (error) {
      console.error('Failed to update contact:', error)
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm')
    } else {
      return format(date, 'MM-dd HH:mm')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  const contactInfo = conversationDetail?.details
  const isPrivateChat = conversationDetail?.type === 'contact'

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-background/80 backdrop-blur-sm flex justify-between items-center">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3 ring-2 ring-background">
            <AvatarImage src={contactInfo?.avatar || "/placeholder.svg"} alt={contactInfo?.name} />
            <AvatarFallback>{(contactInfo?.name || contactInfo?.wxid || '未知').slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              <h2 className="text-base font-semibold">{contactInfo?.name || contactInfo?.wxid || '未知联系人'}</h2>
              {!isPrivateChat && (
                <Badge variant="secondary" className="ml-2">群聊</Badge>
              )}
            </div>
            {contactInfo?.remark_name && (
              <p className="text-xs text-muted-foreground">备注: {contactInfo.remark_name}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
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
              <DropdownMenuItem>导出记录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onScroll={handleScroll}
          >
            {loadingMore && (
              <div className="text-center text-sm text-muted-foreground py-2">
                加载更多消息...
              </div>
            )}
            
            {messages.map((message, index) => {
              const isCustomer = message.sender.wxid === contactInfo?.wxid
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                >
                  {isCustomer && (
                    <Avatar className="h-8 w-8 mr-2 mt-1">
                      <AvatarImage src={message.sender.avatar || "/placeholder.svg"} alt={message.sender.wx_name} />
                      <AvatarFallback>{(message.sender.wx_name || message.sender.wxid).slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isCustomer
                        ? "bg-muted/70 backdrop-blur-sm"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70 text-right">{formatMessageTime(message.created_at)}</p>
                  </div>
                  {!isCustomer && (
                    <Avatar className="h-8 w-8 ml-2 mt-1">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              )
            })}
            
            {isTyping && (
              <div className="flex justify-end">
                <div className="bg-primary/10 rounded-lg p-3 max-w-[70%]">
                  <div className="flex space-x-1">
                    <div
                      className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" className="shrink-0 h-10 w-10">
                <Paperclip className="h-4 w-4" />
              </Button>
              {isPrivateChat && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="shrink-0 h-10 w-10"
                  onClick={handleGetAISuggestion}
                  title="获取AI建议"
                >
                  <Lightbulb className="h-4 w-4" />
                </Button>
              )}
              <div className="relative flex-1">
                <Textarea
                  placeholder="输入消息..."
                  className="min-h-[40px] max-h-[120px] pr-10"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-10">
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
        
        {isPrivateChat && contactInfo && (
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
                      <span className="text-muted-foreground">微信ID:</span>
                      <span>{contactInfo.wxid}</span>
                      {contactInfo.name && (
                        <>
                          <span className="text-muted-foreground">昵称:</span>
                          <span>{contactInfo.name}</span>
                        </>
                      )}
                      {contactInfo.remark_name && (
                        <>
                          <span className="text-muted-foreground">备注:</span>
                          <span>{contactInfo.remark_name}</span>
                        </>
                      )}
                      {contactInfo.group && (
                        <>
                          <span className="text-muted-foreground">分组:</span>
                          <span>{contactInfo.group}</span>
                        </>
                      )}
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
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-muted/50 text-foreground/70 border-0">
                          {tag}
                        </Badge>
                      ))}
                      {tags.length === 0 && (
                        <span className="text-sm text-muted-foreground">暂无标签</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notes" className="p-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    {editingNotes ? (
                      <div className="space-y-3">
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="添加备注..."
                          className="min-h-[100px]"
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleUpdateNotes}>保存</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)}>取消</Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                        onClick={() => setEditingNotes(true)}
                      >
                        {notes || <span className="text-muted-foreground">点击添加备注</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

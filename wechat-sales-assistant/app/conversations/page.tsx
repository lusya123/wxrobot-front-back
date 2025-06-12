"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConversationList } from "@/components/conversation-list"
import { ConversationDetail } from "@/components/conversation-detail"
import { Search, RefreshCw, SlidersHorizontal } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { wechatAccountApi } from "@/lib/wechat-accounts-api"

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<number>(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [wechatAccounts, setWechatAccounts] = useState<any[]>([])

  useEffect(() => {
    loadWechatAccounts()
  }, [])

  const loadWechatAccounts = async () => {
    try {
      const result = await wechatAccountApi.list()
      if (result.body.data && result.body.data.length > 0) {
        setWechatAccounts(result.body.data)
        setSelectedAccountId(result.body.data[0].id)
      }
    } catch (error) {
      console.error('Failed to load wechat accounts:', error)
    }
  }

  const handleRefresh = () => {
    // 触发会话列表刷新
    window.location.reload()
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">会话管理</h1>
            <p className="text-sm text-muted-foreground">管理微信机器人的所有会话和消息</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* 微信账号选择 */}
            <Select value={selectedAccountId.toString()} onValueChange={(value) => setSelectedAccountId(Number(value))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择微信账号" />
              </SelectTrigger>
              <SelectContent>
                {wechatAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索会话..." 
                className="pl-8 w-64" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r overflow-y-auto">
          <ConversationList 
            selectedId={selectedConversation} 
            onSelect={(id) => setSelectedConversation(id)}
            wechatAccountId={selectedAccountId}
            searchQuery={searchQuery}
          />
        </div>
        <div className="w-2/3 flex flex-col">
          {selectedConversation ? (
            <ConversationDetail conversationId={selectedConversation} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="rounded-full bg-muted/50 p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">选择一个会话</h3>
                <p className="text-sm text-muted-foreground max-w-md">从左侧列表中选择一个会话进行查看</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

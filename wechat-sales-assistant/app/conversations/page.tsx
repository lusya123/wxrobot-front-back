"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConversationList } from "@/components/conversation-list"
import { ConversationDetail } from "@/components/conversation-detail"
import { Search, RefreshCw, SlidersHorizontal } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1)

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">对话监控</h1>
            <p className="text-sm text-muted-foreground">实时监控和管理AI对话</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索客户或对话内容..." className="pl-8 w-64" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="对话状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部对话</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="pending">待接管</SelectItem>
                <SelectItem value="human">已接管</SelectItem>
                <SelectItem value="closed">已结束</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9">
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
          <div className="p-4 border-b bg-muted/30">
            <Tabs defaultValue="all">
              <TabsList className="grid grid-cols-4 h-9">
                <TabsTrigger value="all" className="text-xs">
                  全部
                  <Badge className="ml-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/10">42</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">
                  待接管
                  <Badge className="ml-1 bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">8</Badge>
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs">
                  进行中
                  <Badge className="ml-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0">24</Badge>
                </TabsTrigger>
                <TabsTrigger value="closed" className="text-xs">
                  已结束
                  <Badge className="ml-1 bg-gray-100 text-gray-800 hover:bg-gray-200 border-0">10</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <ConversationList selectedId={selectedConversation} onSelect={(id) => setSelectedConversation(id)} />
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
                <h3 className="text-lg font-medium mb-2">选择一个对话</h3>
                <p className="text-sm text-muted-foreground max-w-md">从左侧列表中选择一个对话进行查看或接管</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

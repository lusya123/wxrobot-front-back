"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  QrCode,
  RefreshCw,
  Settings,
  Smartphone,
  Users,
  MessageSquare,
  MoreHorizontal,
  AlertCircle,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { wechatAccountApi, type WechatBot, type BotStatus } from "@/lib/wechat-accounts-api"
import { isAuthenticated } from "@/lib/auth"

const wechatAccountsStatic = [
  {
    id: 1,
    name: "销售助手1号",
    avatar: "/placeholder.svg?height=80&width=80",
    status: "online",
    lastActive: "刚刚",
    friendsCount: 156,
    groupsCount: 12,
    messagesCount: 42,
    autoReply: true,
  },
  {
    id: 2,
    name: "销售助手2号",
    avatar: "/placeholder.svg?height=80&width=80",
    status: "online",
    lastActive: "5分钟前",
    friendsCount: 98,
    groupsCount: 8,
    messagesCount: 15,
    autoReply: true,
  },
  {
    id: 3,
    name: "销售助手3号",
    avatar: "/placeholder.svg?height=80&width=80",
    status: "offline",
    lastActive: "2小时前",
    friendsCount: 124,
    groupsCount: 10,
    messagesCount: 0,
    autoReply: false,
  },
]

const getStatusBadge = (status: BotStatus) => {
  switch (status) {
    case "logged_in":
      return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">在线</Badge>
    case "logged_out":
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">离线</Badge>
    case "scanning":
      return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">扫码中</Badge>
    case "error":
      return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-0">异常</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function WechatAccountsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [wechatAccounts, setWechatAccounts] = useState<WechatBot[]>([])
  const [loading, setLoading] = useState(true)
  const [loginDialog, setLoginDialog] = useState(false)
  const [loginBotId, setLoginBotId] = useState<number | null>(null)
  const [loginQrcode, setLoginQrcode] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<number | null>(null)

  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      toast({
        title: "需要登录",
        description: "请先登录系统",
        variant: "destructive",
      })
    }
  }, [router, toast])

  // 加载机器人列表
  const loadBots = async () => {
    try {
      const response = await wechatAccountApi.list()
      if (response.error === 0 && response.body) {
        setWechatAccounts(response.body.data)
      }
    } catch (error) {
      console.error('Failed to load wechat accounts:', error)
      toast({
        title: "加载失败",
        description: error instanceof Error ? error.message : "加载机器人列表失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 只有在已认证的情况下才加载数据
    if (isAuthenticated()) {
      loadBots()
    }
  }, [])

  // 处理登录
  const handleLogin = async (botId: number) => {
    try {
      setLoginBotId(botId)
      setLoginDialog(true)
      const response = await wechatAccountApi.login(botId)
      setLoginQrcode(response.qrcode)
      
      // TODO: 使用 WebSocket 或轮询检查登录状态
      // 这里暂时模拟登录成功
      setTimeout(() => {
        setLoginDialog(false)
        setLoginQrcode(null)
        setLoginBotId(null)
        loadBots() // 刷新列表
        toast({
          title: "登录成功",
          description: "机器人已成功登录",
        })
      }, 5000)
    } catch (error) {
      console.error('Failed to login bot:', error)
      toast({
        title: "登录失败",
        description: error instanceof Error ? error.message : "登录机器人失败",
        variant: "destructive",
      })
      setLoginDialog(false)
    }
  }

  // 处理登出
  const handleLogout = async (botId: number) => {
    try {
      await wechatAccountApi.logout(botId)
      await loadBots()
      toast({
        title: "登出成功",
        description: "机器人已成功登出",
      })
    } catch (error) {
      console.error('Failed to logout bot:', error)
      toast({
        title: "登出失败",
        description: error instanceof Error ? error.message : "登出机器人失败",
        variant: "destructive",
      })
    }
  }

  // 处理刷新状态
  const handleRefresh = async (botId: number) => {
    setRefreshing(botId)
    await loadBots()
    setTimeout(() => setRefreshing(null), 500)
  }

  // 处理删除
  const handleDelete = async (botId: number) => {
    if (!confirm("确定要删除这个机器人吗？此操作不可撤销。")) {
      return
    }
    
    try {
      await wechatAccountApi.delete(botId)
      await loadBots()
      toast({
        title: "删除成功",
        description: "机器人已成功删除",
      })
    } catch (error) {
      console.error('Failed to delete bot:', error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除机器人失败",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 dashboard-gradient">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">微信账号管理</h2>
          <p className="text-muted-foreground">管理您的销售助手微信账号</p>
        </div>
        <Button onClick={() => router.push("/wechat-accounts/new")}>
          <Plus className="h-4 w-4 mr-2" />
          添加微信账号
        </Button>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="bg-background/60 backdrop-blur-sm">
          <TabsTrigger value="accounts">账号管理</TabsTrigger>
          <TabsTrigger value="logs">操作日志</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wechatAccounts.map((account) => (
              <Card key={account.id} className="card-hover overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-3">
                        <AvatarImage src={account.avatar || "/placeholder.svg"} alt={account.name} />
                        <AvatarFallback>{account.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <div className="flex items-center mt-1">
                          {getStatusBadge(account.status)}
                          {account.owner_name && (
                            <span className="text-xs text-muted-foreground ml-2">
                              负责人: {account.owner_name}
                              {account.creator_type === 'subordinate' && (
                                <span className="text-blue-600 ml-1">(您创建的用户)</span>
                              )}
                              {account.creator_type === 'self' && (
                                <span className="text-green-600 ml-1">(您创建)</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>账号操作</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/wechat-accounts/edit/${account.id}`)}>
                          <Settings className="h-4 w-4 mr-2" />
                          账号设置
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRefresh(account.id)}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing === account.id ? 'animate-spin' : ''}`} />
                          刷新状态
                        </DropdownMenuItem>
                        {account.status === "logged_out" ? (
                          <DropdownMenuItem onClick={() => handleLogin(account.id)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            登录账号
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleLogout(account.id)}>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            登出账号
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(account.id)}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          删除账号
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 mt-4">
                    {account.wxid && (
                      <div className="text-sm text-muted-foreground">
                        微信号: {account.wxid}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      创建时间: {new Date(account.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/wechat-accounts/edit/${account.id}`)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    配置管理
                  </Button>
                  <Button 
                    size="sm"
                    disabled={account.status !== "logged_in"}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    查看对话
                  </Button>
                </CardFooter>
              </Card>
            ))}

            <Card 
              className="border-dashed flex flex-col items-center justify-center p-6 h-[300px] cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push("/wechat-accounts/new")}
            >
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">添加新微信账号</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">添加新的微信账号以扩展您的销售网络</p>
              <Button>
                <QrCode className="h-4 w-4 mr-2" />
                扫码登录
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 登录二维码对话框 */}
      <Dialog open={loginDialog} onOpenChange={setLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>扫码登录微信</DialogTitle>
            <DialogDescription>
              请使用微信扫描下方二维码登录机器人账号
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            {loginQrcode ? (
              <img src={loginQrcode} alt="Login QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 bg-muted rounded flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginDialog(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

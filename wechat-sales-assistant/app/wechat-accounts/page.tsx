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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const wechatAccounts = [
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case "online":
      return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">在线</Badge>
    case "offline":
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">离线</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function WechatAccountsPage() {
  return (
    <div className="p-8 space-y-6 dashboard-gradient">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">微信账号管理</h2>
          <p className="text-muted-foreground">管理您的销售助手微信账号</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加微信账号
        </Button>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="bg-background/60 backdrop-blur-sm">
          <TabsTrigger value="accounts">账号管理</TabsTrigger>
          <TabsTrigger value="settings">全局设置</TabsTrigger>
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
                          <span className="text-xs text-muted-foreground ml-2">{account.lastActive}</span>
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
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          账号设置
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          刷新状态
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <QrCode className="h-4 w-4 mr-2" />
                          重新登录
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          停用账号
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div className="bg-muted/50 p-2 rounded-lg">
                      <div className="flex flex-col items-center">
                        <Users className="h-4 w-4 mb-1 text-muted-foreground" />
                        <span className="text-lg font-semibold">{account.friendsCount}</span>
                        <span className="text-xs text-muted-foreground">好友</span>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-lg">
                      <div className="flex flex-col items-center">
                        <Users className="h-4 w-4 mb-1 text-muted-foreground" />
                        <span className="text-lg font-semibold">{account.groupsCount}</span>
                        <span className="text-xs text-muted-foreground">群聊</span>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-lg">
                      <div className="flex flex-col items-center">
                        <MessageSquare className="h-4 w-4 mb-1 text-muted-foreground" />
                        <span className="text-lg font-semibold">{account.messagesCount}</span>
                        <span className="text-xs text-muted-foreground">消息</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">自动回复</span>
                    </div>
                    <Switch checked={account.autoReply} />
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between pt-2">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    好友管理
                  </Button>
                  <Button size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    查看对话
                  </Button>
                </CardFooter>
              </Card>
            ))}

            <Card className="border-dashed flex flex-col items-center justify-center p-6 h-[300px]">
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

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>微信账号全局设置</CardTitle>
              <CardDescription>配置适用于所有微信账号的通用设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">自动化设置</h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-accept">自动通过好友请求</Label>
                      <p className="text-sm text-muted-foreground">自动接受新的好友请求</p>
                    </div>
                    <Switch id="auto-accept" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-group">自动创建客户服务群</Label>
                      <p className="text-sm text-muted-foreground">根据设定条件自动创建和管理客户服务群</p>
                    </div>
                    <Switch id="auto-group" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-reply">离线自动回复</Label>
                      <p className="text-sm text-muted-foreground">账号离线时自动回复消息</p>
                    </div>
                    <Switch id="auto-reply" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">消息模板</h3>
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">欢迎语</Label>
                  <Input
                    id="welcome-message"
                    defaultValue="您好！我是智能销售助手，很高兴为您服务。请问有什么可以帮助您的吗？"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offline-message">离线消息</Label>
                  <Input
                    id="offline-message"
                    defaultValue="您好，我暂时不在线，稍后会回复您的消息。如有紧急事项，请联系我们的客服热线。"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-welcome">群欢迎语</Label>
                  <Input
                    id="group-welcome"
                    defaultValue="欢迎加入我们的客户服务群，有任何问题都可以在群里提出，我们会尽快为您解答。"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>保存设置</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

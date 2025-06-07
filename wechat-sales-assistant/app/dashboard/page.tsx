'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock, CheckCircle2, User as UserIcon, Settings, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { getCurrentUser, logout, getUser, isAuthenticated, type User } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // 首先检查是否已登录
        if (!isAuthenticated()) {
          router.push('/login')
          return
        }

        // 尝试从本地存储获取用户信息
        const localUser = getUser()
        if (localUser) {
          setUser(localUser)
          
          // 如果是管理员，重定向到管理界面
          if (localUser.role !== 'user') {
            router.push('/')
            return
          }
        }

        // 从API获取最新用户信息
        try {
          const currentUser = await getCurrentUser()
          if (currentUser) {
            setUser(currentUser)
            
            // 如果是管理员，重定向到管理界面
            if (currentUser.role !== 'user') {
              router.push('/')
              return
            }
          }
        } catch (error) {
          console.error('获取用户信息失败:', error)
          // 如果获取用户信息失败，使用本地存储的信息
          if (!localUser) {
            router.push('/login')
            return
          }
        }
      } catch (error) {
        console.error('初始化用户信息失败:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    initializeUser()
  }, [router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold mr-3">
                AI
              </div>
              <h1 className="text-xl font-semibold">微信智能销售助手</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">欢迎回来，{user.username}！</h2>
          <p className="text-gray-600 dark:text-gray-300">查看您的销售数据和客户互动情况</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日对话数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> 较昨日
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">新增客户</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+25%</span> 较昨日
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">响应时间</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2秒</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-0.3秒</span> 较昨日
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成功率</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.5%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2.1%</span> 较昨日
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 快捷操作 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                查看活跃对话
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <UserIcon className="h-4 w-4 mr-2" />
                客户管理
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                个人设置
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">今日待办</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">回复李先生咨询</span>
                  <Badge variant="secondary">待处理</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">更新产品资料</span>
                  <Badge variant="outline">已完成</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">客户回访</span>
                  <Badge variant="secondary">待处理</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">最近活动</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>新客户添加</span>
                  <span className="text-muted-foreground">5分钟前</span>
                </div>
                <div className="flex justify-between">
                  <span>对话已接管</span>
                  <span className="text-muted-foreground">15分钟前</span>
                </div>
                <div className="flex justify-between">
                  <span>产品介绍发送</span>
                  <span className="text-muted-foreground">30分钟前</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI助手状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI助手状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="font-medium">AI助手</p>
                  <p className="text-sm text-muted-foreground">运行正常</p>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="font-medium">知识库</p>
                  <p className="text-sm text-muted-foreground">已更新</p>
                </div>
                <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="font-medium">微信连接</p>
                  <p className="text-sm text-muted-foreground">良好</p>
                </div>
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 
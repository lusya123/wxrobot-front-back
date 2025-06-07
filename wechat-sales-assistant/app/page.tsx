'use client'

import { useEffect, useState, Suspense, lazy } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Users, UserCheck, Clock, TrendingUp, BellRing, CheckCircle2, UserCog, Plus, Shield, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser, isAdmin, isSuperAdmin, isAuthenticated, type User } from "@/lib/auth"
import { FullScreenLoading, LoadingSpinner } from "@/components/ui/loading-spinner"

// 懒加载重型组件
const DashboardChart = lazy(() => import("@/components/dashboard-chart").then(mod => ({ default: mod.DashboardChart })))
const RecentActivities = lazy(() => import("@/components/recent-activities").then(mod => ({ default: mod.RecentActivities })))

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const initializeUser = async () => {
      try {
        setIsLoading(true)
        // 首先检查是否已登录
        if (!isAuthenticated()) {
          router.push('/login')
          return
        }

        // 从API获取用户信息
        const user = await getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }
        
        // 如果是普通用户，重定向到用户专用dashboard
        if (user.role === 'user') {
          router.push('/dashboard')
          return
        }
        
        setCurrentUser(user)
      } catch (error) {
        console.error('获取用户信息失败:', error)
        setError('加载用户信息失败，请刷新页面重试')
        // 延迟后重定向，给用户看到错误信息的机会
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } finally {
        setIsLoading(false)
      }
    }

    initializeUser()
  }, [router])

  // 加载状态
  if (isLoading) {
    return <FullScreenLoading text="正在加载仪表盘..." />
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg">{error}</div>
          <Button onClick={() => window.location.reload()}>
            重新加载
          </Button>
        </div>
      </div>
    )
  }

  // 用户未加载完成
  if (!currentUser) {
    return <FullScreenLoading text="正在验证用户信息..." />
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '超级管理员'
      case 'admin':
        return '管理员'
      default:
        return '管理员'
    }
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 dashboard-gradient">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {getRoleDisplayName(currentUser.role)}仪表盘
          </h2>
          <p className="text-muted-foreground text-sm">
            欢迎回来，{currentUser.username}！查看销售助手的实时数据和管理系统用户
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/admin/users">
            <Button variant="outline" className="h-9 gap-1">
              <UserCog className="h-4 w-4" />
              <span>用户管理</span>
            </Button>
          </Link>
          <Button variant="outline" className="h-9 gap-1">
            <BellRing className="h-4 w-4" />
            <span>通知中心</span>
            <Badge className="ml-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/10">3</Badge>
          </Button>
          <Button className="h-9">
            <TrendingUp className="h-4 w-4 mr-2" />
            生成报告
          </Button>
        </div>
      </div>

      {/* 系统统计卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃对话数</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">42</div>
            <div className="flex items-center mt-1">
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                12%
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">较昨日</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统用户数</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {isSuperAdmin() ? '127' : '23'}
            </div>
            <div className="flex items-center mt-1">
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">
                <Plus className="h-3 w-3 mr-1" />
                5
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">本周新增</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待接管对话</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">8</div>
            <div className="flex items-center mt-1">
              <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100 border-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                75%
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">较昨日</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">1.8秒</div>
            <div className="flex items-center mt-1">
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                -0.3秒
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">较昨日</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-background/60 backdrop-blur-sm">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="users">用户管理</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
          <TabsTrigger value="automation">自动化</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-base">对话统计</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Suspense fallback={<LoadingSpinner text="加载图表中..." />}>
                  <DashboardChart />
                </Suspense>
              </CardContent>
            </Card>

            <Card className="col-span-3 shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-base">最近活动</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<LoadingSpinner size="sm" text="加载活动中..." />}>
                  <RecentActivities />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 用户管理快捷操作 */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <UserCog className="h-5 w-5 mr-2" />
                  用户管理
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/admin/users">
                  <Button className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    查看所有用户
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    创建新用户
                  </Button>
                </Link>
                <div className="pt-2 text-sm text-muted-foreground">
                  {isSuperAdmin() && (
                    <p>作为超级管理员，您可以管理所有用户和管理员账户。</p>
                  )}
                  {currentUser.role === 'admin' && (
                    <p>作为管理员，您可以创建和管理普通用户账户。</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 权限概览 */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  权限概览
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">您的角色</span>
                  {currentUser.role === 'super_admin' ? (
                    <Badge className="bg-red-100 text-red-800">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      超级管理员
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      管理员
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>查看系统数据</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <span>管理用户账户</span>
                  </div>
                  {isSuperAdmin() && (
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>管理管理员账户</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 最近用户活动 */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-base">最近用户活动</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">新用户注册</p>
                      <p className="text-muted-foreground">张小明加入了系统</p>
                    </div>
                    <span className="text-xs text-muted-foreground">2分钟前</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">权限变更</p>
                      <p className="text-muted-foreground">李经理权限已更新</p>
                    </div>
                    <span className="text-xs text-muted-foreground">1小时前</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">用户登录</p>
                      <p className="text-muted-foreground">王总登录系统</p>
                    </div>
                    <span className="text-xs text-muted-foreground">3小时前</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

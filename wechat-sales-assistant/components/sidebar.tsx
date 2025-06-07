"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  BarChart3,
  MessageSquare,
  BookOpen,
  Settings,
  Users,
  Calendar,
  LogOut,
  Moon,
  Sun,
  BellRing,
  Smartphone,
  UserCog,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { getUser, logout, isAdmin, type User } from "@/lib/auth"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

interface RouteItem {
  label: string
  icon: any
  href: string
  active: boolean
  badge?: number
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUser(user)
  }, [router])

  const handleLogout = () => {
    logout()
  }

  // 根据用户角色定义不同的路由
  const getRoutes = (): RouteItem[] => {
    if (!currentUser) return []

    const baseRoutes: RouteItem[] = [
      {
        label: "仪表盘",
        icon: BarChart3,
        href: "/",
        active: pathname === "/",
      },
      {
        label: "对话监控",
        icon: MessageSquare,
        href: "/conversations",
        active: pathname === "/conversations",
        badge: 8,
      },
      {
        label: "知识库管理",
        icon: BookOpen,
        href: "/knowledge",
        active: pathname === "/knowledge",
      },
      {
        label: "客户管理",
        icon: Users,
        href: "/customers",
        active: pathname === "/customers",
      },
      {
        label: "预约管理",
        icon: Calendar,
        href: "/appointments",
        active: pathname === "/appointments",
      },
      {
        label: "微信账号",
        icon: Smartphone,
        href: "/wechat-accounts",
        active: pathname === "/wechat-accounts",
        badge: 3,
      },
    ]

    // 管理员专用路由
    const adminRoutes: RouteItem[] = [
      {
        label: "用户管理",
        icon: UserCog,
        href: "/admin/users",
        active: pathname === "/admin/users",
      },
    ]

    const settingsRoute: RouteItem = {
      label: "设置中心",
      icon: Settings,
      href: "/settings",
      active: pathname === "/settings",
    }

    // 根据角色返回不同的路由组合
    if (isAdmin()) {
      return [...baseRoutes, ...adminRoutes, settingsRoute]
    } else {
      return [...baseRoutes, settingsRoute]
    }
  }

  const routes = getRoutes()

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '超级管理员'
      case 'admin':
        return '管理员'
      case 'user':
        return '用户'
      default:
        return '未知'
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <div
      className={cn(
        "pb-12 w-64 sidebar-gradient backdrop-blur-sm border-r border-gray-100 dark:border-gray-800 shadow-sm",
        className,
      )}
    >
      <div className="space-y-4 py-4">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold mr-3">
                AI
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">智能销售助手</h2>
                <p className="text-xs text-muted-foreground">企业级AI销售解决方案</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-8 bg-muted/50 rounded-lg p-3">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-3 ring-2 ring-background">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="用户头像" />
                <AvatarFallback>{currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{currentUser?.username || '未知用户'}</p>
                <p className="text-xs text-muted-foreground">{getRoleDisplayName(currentUser?.role || 'user')}</p>
              </div>
            </div>
            <div className="flex space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <BellRing className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between p-2">
                    <p className="text-sm font-medium">通知</p>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      全部标为已读
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">需要接管对话</p>
                          <span className="text-xs text-muted-foreground">5分钟前</span>
                        </div>
                        <p className="text-xs">李先生(ABC科技)的对话需要人工接管</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">新预约提醒</p>
                          <span className="text-xs text-muted-foreground">30分钟前</span>
                        </div>
                        <p className="text-xs">王总(未来传媒)预约了产品演示</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">新客户添加</p>
                          <span className="text-xs text-muted-foreground">2小时前</span>
                        </div>
                        <p className="text-xs">AI助手添加了新客户：赵女士(智慧教育)</p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2 text-center">
                    <Link href="/notifications" className="text-xs text-primary hover:underline">
                      查看全部通知
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200",
                  route.active
                    ? "text-primary bg-primary/10 dark:bg-primary/20"
                    : "text-foreground/70 dark:text-foreground/60",
                )}
              >
                <div className="flex items-center justify-between flex-1">
                  <div className="flex items-center">
                    <route.icon
                      className={cn("h-5 w-5 mr-3", route.active ? "text-primary" : "text-muted-foreground")}
                    />
                    {route.label}
                  </div>
                  {route.badge && (
                    <Badge
                      className={cn(
                        "text-xs",
                        route.active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground dark:bg-muted/50",
                      )}
                    >
                      {route.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        {/* 退出登录按钮 */}
        <div className="px-6">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            退出登录
          </Button>
        </div>
      </div>
    </div>
  )
}

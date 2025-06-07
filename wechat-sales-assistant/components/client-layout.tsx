'use client'

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Sidebar from "@/components/sidebar"
import { NotificationsProvider } from "@/components/notifications-provider"
import { usePathname } from "next/navigation"
import { Toaster as SonnerToaster } from "sonner"
import { useEffect, useState } from "react"

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  
  // 不需要侧边栏的页面
  const noSidebarPages = ['/login']
  const showSidebar = !noSidebarPages.includes(pathname)

  useEffect(() => {
    setIsMounted(true)
    
    // 处理浏览器扩展添加的类名，避免hydration错误
    const handleBrowserExtensionClasses = () => {
      if (typeof window !== 'undefined' && document.body) {
        // 移除可能导致hydration错误的类名
        const problematicClasses = [
          'vsc-initialized', 
          'chrome-extension-boilerplate-react-vite',
          'extension-port-ready'
        ]
        
        problematicClasses.forEach(className => {
          if (document.body.classList.contains(className)) {
            document.body.classList.remove(className)
          }
        })
        
        // 使用 MutationObserver 监听DOM变化，实时移除扩展添加的类名
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              problematicClasses.forEach(className => {
                if (document.body.classList.contains(className)) {
                  document.body.classList.remove(className)
                }
              })
            }
          })
        })
        
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ['class']
        })
        
        // 清理observer
        return () => observer.disconnect()
      }
    }
    
    // 立即执行一次，然后设置定期检查
    const cleanup = handleBrowserExtensionClasses()
    const intervalId = setInterval(handleBrowserExtensionClasses, 1000)
    
    return () => {
      if (cleanup) cleanup()
      clearInterval(intervalId)
    }
  }, [])

  // 避免hydration错误，在客户端mounted之前显示加载状态
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <NotificationsProvider>
        {showSidebar ? (
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        ) : (
          <main className="min-h-screen">{children}</main>
        )}
        <Toaster />
        <SonnerToaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
          }}
        />
      </NotificationsProvider>
    </ThemeProvider>
  )
} 
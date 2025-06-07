'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Loader2 } from "lucide-react"
import { login, type LoginRequest } from "@/lib/auth"
import { toast } from "sonner"

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      toast.error('请输入用户名和密码')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await login(formData)
      
      // 检查登录是否成功
      if (response.error === 0 && response.body.user) {
        const user = response.body.user
        toast.success(`欢迎回来，${user.username}！`)
        
        // 根据用户角色跳转到不同页面
        if (user.role === 'user') {
          router.push('/dashboard')
        } else {
          router.push('/')
        }
      } else {
        toast.error(response.message || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      toast.error(error instanceof Error ? error.message : '登录失败，请检查网络连接')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 bg-grid-pattern">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      <Card className="w-[380px] shadow-xl border-0 glass-effect animate-fade-in">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl">
              AI
            </div>
          </div>
          <CardTitle className="text-xl text-center">微信智能销售助手</CardTitle>
          <CardDescription className="text-center text-sm">企业级AI销售解决方案</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-sm">
                用户名
              </Label>
              <Input 
                id="username" 
                name="username"
                type="text" 
                placeholder="请输入用户名" 
                className="h-10"
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm">
                  密码
                </Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  忘记密码?
                </button>
              </div>
              <Input 
                id="password" 
                name="password"
                type="password" 
                className="h-10"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            
            {/* 开发环境提示 */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <div className="font-medium mb-1">测试账号：</div>
              <div>超级管理员: superadmin / admin123</div>
              <div>普通管理员: admin / admin123</div>
              <div>普通用户: user / user123</div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <Button 
              type="submit" 
              className="w-full h-10 shadow-sm" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? '登录中...' : '登录'}
            </Button>
            
            <div className="relative my-4 w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">或</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full h-10" type="button" disabled={isLoading}>
              <QrCode className="h-4 w-4 mr-2" />
              使用企业微信扫码登录
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

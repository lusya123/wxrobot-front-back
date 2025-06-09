"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { wechatAccountApi } from "@/lib/wechat-accounts-api"
import { isAuthenticated } from "@/lib/auth"

export default function NewWechatAccountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: ""
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 清除之前的错误信息
    setError(null)
    
    if (!formData.name) {
      const errorMsg = "机器人名称为必填项"
      setError(errorMsg)
      toast({
        title: "请填写所有必填字段",
        description: errorMsg,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const bot = await wechatAccountApi.create(formData)
      toast({
        title: "创建成功",
        description: "微信机器人创建成功，正在跳转到配置页面...",
      })
      // 跳转到编辑页面进行详细配置
      router.push(`/wechat-accounts/edit/${bot.id}`)
    } catch (error) {
      console.error('Failed to create bot:', error)
      const errorMsg = error instanceof Error ? error.message : "创建机器人失败"
      
      // 在界面上显示错误
      setError(errorMsg)
      
      // 同时显示toast提示
      toast({
        title: "创建失败",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6 dashboard-gradient">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">创建微信机器人</h2>
          <p className="text-muted-foreground">添加新的微信销售助手机器人</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>
            请填写机器人的基本信息，创建后可以进行详细配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>创建失败</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">机器人名称 *</Label>
              <Input
                id="name"
                placeholder="例如：销售助手-华南区"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                  // 用户开始输入时清除错误信息
                  if (error) {
                    setError(null)
                  }
                }}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                用于在后台管理中识别不同的机器人
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                创建机器人
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
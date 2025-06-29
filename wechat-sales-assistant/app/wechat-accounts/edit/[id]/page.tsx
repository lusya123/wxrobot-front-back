"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, User, Bot, Brain, Users2, Key } from "lucide-react"
import { wechatAccountApi, type WechatBotWithConfig, type UpdateWechatBotConfigRequest } from "@/lib/wechat-accounts-api"

export default function EditWechatAccountPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const botId = Number(params.id)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bot, setBot] = useState<WechatBotWithConfig | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  })
  const [savingPassword, setSavingPassword] = useState(false)
  
  // 表单数据 - 使用部分类型以支持未设置的值
  const [formData, setFormData] = useState<Partial<UpdateWechatBotConfigRequest>>({})

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载机器人信息
        const botData = await wechatAccountApi.get(botId)
        setBot(botData)
        
        // 如果有配置，更新表单数据
        if (botData.config) {
          const { id, bot_id, ...configData } = botData.config
          setFormData({
            ...configData,
            name: botData.name,
          })
        } else {
          // 设置默认值
          setFormData({
            name: botData.name,
            tone_style: "professional",
            listen_mode_private_chat: "all",
            listen_mode_group_chat: "none",
            reply_trigger_on_mention: true,
            learning_scope: "marked",
            learning_mode: "manual_approval",
            unhandled_question_action: "reply_text",
          })
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        toast({
          title: "加载失败",
          description: error instanceof Error ? error.message : "加载数据失败",
          variant: "destructive",
        })
        router.push("/wechat-accounts")
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [botId, router, toast])

  // 保存配置
  const handleSave = async () => {
    setSaving(true)
    try {
      await wechatAccountApi.update(botId, formData as UpdateWechatBotConfigRequest)
      toast({
        title: "保存成功",
        description: "机器人配置已更新",
      })
    } catch (error) {
      console.error('Failed to save:', error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "保存配置失败",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // 处理密码修改
  const handlePasswordSave = async () => {
    // 验证密码
    if (!passwordForm.newPassword) {
      toast({
        title: "请输入新密码",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "密码太短",
        description: "密码长度至少为6位",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "密码不一致",
        description: "两次输入的密码不一致",
        variant: "destructive",
      })
      return
    }

    setSavingPassword(true)
    try {
      await wechatAccountApi.update(botId, { password: passwordForm.newPassword })
      toast({
        title: "密码修改成功",
        description: "机器人密码已更新",
      })
      setShowPasswordDialog(false)
      setPasswordForm({ newPassword: "", confirmPassword: "" })
    } catch (error) {
      console.error('Failed to update password:', error)
      toast({
        title: "密码修改失败",
        description: error instanceof Error ? error.message : "修改密码失败",
        variant: "destructive",
      })
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!bot) {
    return null
  }

  return (
    <div className="p-8 space-y-6 dashboard-gradient max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">编辑机器人配置</h2>
            <p className="text-muted-foreground">{bot.name}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存配置
        </Button>
      </div>

      <Tabs defaultValue="identity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="identity" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            身份与角色
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            行为与触发
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            智能与知识
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            协作与提醒
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 身份与角色 - 简化版本 */}
        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle>身份与角色设置</CardTitle>
              <CardDescription>定义机器人的身份定位和对话风格</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role_description">角色描述/SOP</Label>
                <Textarea
                  id="role_description"
                  placeholder="详细描述机器人的定位，例如：负责售前技术咨询，解答产品功能、价格、部署方案等问题..."
                  value={formData.role_description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_description: e.target.value }))}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responsible_wxid">负责人（微信好友）</Label>
                <Input
                  id="responsible_wxid"
                  placeholder="请输入负责人的微信ID"
                  value={formData.responsible_wxid || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsible_wxid: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  机器人连接后，可以从好友列表中选择负责人。负责人将接收重要通知和人工接管请求。
                </p>
              </div>

              <div className="space-y-2">
                <Label>机器人密码</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    修改密码
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    机器人客户端登录时需要使用的密码
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 行为与触发 - 简化版本 */}
        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle>行为与触发设置</CardTitle>
              <CardDescription>配置机器人的工作时间、自动化行为和回复触发条件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">工作时间</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="work_time">启用工作时间限制</Label>
                    <p className="text-sm text-muted-foreground">仅在工作时间内回复消息</p>
                  </div>
                  <Switch
                    id="work_time"
                    checked={formData.is_active_on_work_time || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active_on_work_time: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">自动化设置</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_accept">自动通过好友请求</Label>
                    <p className="text-sm text-muted-foreground">自动接受新的好友请求</p>
                  </div>
                  <Switch
                    id="auto_accept"
                    checked={formData.auto_accept_friend_request || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_accept_friend_request: checked }))}
                  />
                </div>

                {formData.auto_accept_friend_request && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="welcome_message">好友欢迎语</Label>
                    <Textarea
                      id="welcome_message"
                      placeholder="您好！我是智能销售助手，很高兴为您服务。请问有什么可以帮助您的吗？"
                      value={formData.friend_request_welcome_message || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, friend_request_welcome_message: e.target.value }))}
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="welcome_group">欢迎新群成员</Label>
                    <p className="text-sm text-muted-foreground">新成员加入群聊时自动发送欢迎消息</p>
                  </div>
                  <Switch
                    id="welcome_group"
                    checked={formData.welcome_new_group_member || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, welcome_new_group_member: checked }))}
                  />
                </div>

                {formData.welcome_new_group_member && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="group_welcome_message">群欢迎语</Label>
                    <Textarea
                      id="group_welcome_message"
                      placeholder="欢迎加入我们的客户服务群，有任何问题都可以在群里提出，我们会尽快为您解答。"
                      value={formData.new_member_welcome_message || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, new_member_welcome_message: e.target.value }))}
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">触发条件</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="wake_words">唤醒词</Label>
                  <Input
                    id="wake_words"
                    placeholder="输入唤醒词，多个词用英文逗号分隔，如：小助手,助手,你好"
                    value={formData.wake_words || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, wake_words: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    设置唤醒词后，机器人将在检测到这些词时触发回复。留空则仅响应@消息。
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reply_on_mention">@提及时回复</Label>
                    <p className="text-sm text-muted-foreground">被@时自动触发回复</p>
                  </div>
                  <Switch
                    id="reply_on_mention"
                    checked={formData.reply_trigger_on_mention !== false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reply_trigger_on_mention: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trigger_words">触发关键词</Label>
                  <Input
                    id="trigger_words"
                    placeholder="其他触发关键词，多个词用英文逗号分隔"
                    value={formData.reply_trigger_words || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, reply_trigger_words: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    除唤醒词外的其他触发关键词，可用于特定场景的触发。
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">离线设置</h3>
                <div className="space-y-2">
                  <Label htmlFor="offline_message">离线自动回复消息</Label>
                  <Textarea
                    id="offline_message"
                    placeholder="您好，我暂时不在线，稍后会回复您的消息。如有紧急事项，请联系我们的客服热线。"
                    value={formData.offline_reply_message || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, offline_reply_message: e.target.value }))}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    机器人离线时自动回复的消息内容
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: 智能与知识 - 简化版本 */}
        <TabsContent value="intelligence">
          <Card>
            <CardHeader>
              <CardTitle>智能与知识设置</CardTitle>
              <CardDescription>配置AI模型、知识库和学习能力</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ai_model">主AI模型</Label>
                <Select
                  value={formData.main_ai_model_id?.toString() || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, main_ai_model_id: value ? Number(value) : undefined }))}
                >
                  <SelectTrigger id="ai_model">
                    <SelectValue placeholder="选择AI模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">GPT-4</SelectItem>
                    <SelectItem value="2">Kimi</SelectItem>
                    <SelectItem value="3">Claude</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: 协作与提醒 - 简化版本 */}
        <TabsContent value="collaboration">
          <Card>
            <CardHeader>
              <CardTitle>协作与提醒设置</CardTitle>
              <CardDescription>配置人工接管和关键信息提醒</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="failed_attempts">连续未回答触发</Label>
                <Input
                  id="failed_attempts"
                  type="number"
                  placeholder="连续N次未能回答后触发"
                  value={formData.escalation_failed_attempts_trigger || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, escalation_failed_attempts_trigger: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 修改密码对话框 */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改机器人密码</DialogTitle>
            <DialogDescription>
              请输入新的密码，机器人客户端将使用此密码进行登录
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="请输入新密码"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false)
                setPasswordForm({ newPassword: "", confirmPassword: "" })
              }}
              disabled={savingPassword}
            >
              取消
            </Button>
            <Button onClick={handlePasswordSave} disabled={savingPassword}>
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">设置中心</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">基本设置</TabsTrigger>
          <TabsTrigger value="takeover">接管规则</TabsTrigger>
          <TabsTrigger value="automation">自动化流程</TabsTrigger>
          <TabsTrigger value="accounts">账号管理</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>基本设置</CardTitle>
              <CardDescription>配置系统的基本参数和行为</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">系统信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">公司名称</Label>
                    <Input id="company-name" defaultValue="智能销售科技有限公司" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="system-name">系统名称</Label>
                    <Input id="system-name" defaultValue="微信智能销售助手" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-intro">公司简介</Label>
                  <Textarea
                    id="company-intro"
                    defaultValue="专注于AI驱动的销售自动化解决方案，帮助企业提升销售效率，降低人工成本。"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">AI设置</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-model">AI模型</Label>
                    <Select defaultValue="gpt-4">
                      <SelectTrigger id="ai-model">
                        <SelectValue placeholder="选择AI模型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                        <SelectItem value="claude">Claude</SelectItem>
                        <SelectItem value="koujing">扣子</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="response-time">最大响应时间(秒)</Label>
                    <Input id="response-time" type="number" defaultValue="3" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="ai-learning" defaultChecked />
                  <Label htmlFor="ai-learning">启用AI自动学习</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">通知设置</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notification">电子邮件通知</Label>
                    <Switch id="email-notification" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="wechat-notification">微信通知</Label>
                    <Switch id="wechat-notification" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notification">短信通知</Label>
                    <Switch id="sms-notification" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>保存设置</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="takeover">
          <Card>
            <CardHeader>
              <CardTitle>接管规则设置</CardTitle>
              <CardDescription>配置何时需要人工接管AI对话</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">关键词触发</h3>
                <div className="space-y-2">
                  <Label htmlFor="keywords">触发关键词（用逗号分隔）</Label>
                  <Textarea id="keywords" defaultValue="人工,客服,投诉,不满意,退款,经理" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="keyword-trigger" defaultChecked />
                  <Label htmlFor="keyword-trigger">启用关键词触发</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">意向度触发</h3>
                <div className="space-y-2">
                  <Label htmlFor="intention-score">意向度分数阈值（0-100）</Label>
                  <Input id="intention-score" type="number" defaultValue="80" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="intention-trigger" defaultChecked />
                  <Label htmlFor="intention-trigger">启用意向度触发</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">特定问题触发</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="price-question">询问价格</Label>
                    <Switch id="price-question" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="discount-question">要求折扣</Label>
                    <Switch id="discount-question" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="complaint-question">投诉问题</Label>
                    <Switch id="complaint-question" defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">复杂问题识别</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="complex-question">AI无法有效回答时自动接管</Label>
                  <Switch id="complex-question" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidence-threshold">置信度阈值（0-100）</Label>
                  <Input id="confidence-threshold" type="number" defaultValue="60" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>保存规则</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>自动化流程设置</CardTitle>
              <CardDescription>配置系统自动化行为和流程</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">好友请求处理</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-accept">自动通过好友请求</Label>
                  <Switch id="auto-accept" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">欢迎语</Label>
                  <Textarea
                    id="welcome-message"
                    defaultValue="您好！我是智能销售助手，很高兴为您服务。请问有什么可以帮助您的吗？"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">群聊管理</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-group">自动创建客户服务群</Label>
                  <Switch id="auto-group" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-conditions">创建条件</Label>
                  <Select defaultValue="high-intention">
                    <SelectTrigger id="group-conditions">
                      <SelectValue placeholder="选择创建条件" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-intention">高意向客户</SelectItem>
                      <SelectItem value="after-demo">产品演示后</SelectItem>
                      <SelectItem value="after-purchase">购买后</SelectItem>
                      <SelectItem value="manual">仅手动创建</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-announcement">群公告模板</Label>
                  <Textarea
                    id="group-announcement"
                    defaultValue="欢迎加入智能销售产品交流群，本群由AI助手和专业销售顾问为您提供服务。"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">信息收集流程</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-collect">自动收集客户信息</Label>
                  <Switch id="auto-collect" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>需要收集的信息</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="collect-name" defaultChecked />
                      <Label htmlFor="collect-name">姓名</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="collect-company" defaultChecked />
                      <Label htmlFor="collect-company">公司</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="collect-position" defaultChecked />
                      <Label htmlFor="collect-position">职位</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="collect-phone" defaultChecked />
                      <Label htmlFor="collect-phone">电话</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="collect-email" />
                      <Label htmlFor="collect-email">邮箱</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="collect-needs" defaultChecked />
                      <Label htmlFor="collect-needs">需求</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>保存设置</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>账号管理</CardTitle>
              <CardDescription>管理系统用户账号和权限</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">用户列表</h3>
                  <Button variant="outline" size="sm">
                    添加用户
                  </Button>
                </div>
                <div className="border rounded-md">
                  <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
                    <div>用户名</div>
                    <div>角色</div>
                    <div>邮箱</div>
                    <div>状态</div>
                    <div>操作</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-5 gap-4 p-4 items-center">
                      <div>admin</div>
                      <div>管理员</div>
                      <div>admin@example.com</div>
                      <div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">活跃</Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          编辑
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-4 items-center">
                      <div>张经理</div>
                      <div>销售经理</div>
                      <div>zhang@example.com</div>
                      <div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">活跃</Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          停用
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-4 items-center">
                      <div>王销售</div>
                      <div>销售人员</div>
                      <div>wang@example.com</div>
                      <div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">活跃</Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          停用
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 p-4 items-center">
                      <div>李销售</div>
                      <div>销售人员</div>
                      <div>li@example.com</div>
                      <div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">活跃</Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          停用
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">角色管理</h3>
                <div className="border rounded-md">
                  <div className="grid grid-cols-3 gap-4 p-4 font-medium border-b">
                    <div>角色名称</div>
                    <div>权限描述</div>
                    <div>操作</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-3 gap-4 p-4">
                      <div>管理员</div>
                      <div>系统所有功能的完全访问权限</div>
                      <div>
                        <Button variant="ghost" size="sm">
                          编辑
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-4">
                      <div>销售经理</div>
                      <div>管理销售团队、查看所有对话、编辑知识库</div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          删除
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-4">
                      <div>销售人员</div>
                      <div>管理自己的对话、查看知识库</div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
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

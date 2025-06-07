import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Edit, Trash2, Eye } from "lucide-react"

const scriptItems = [
  {
    id: 1,
    title: "初次接触话术",
    description: "与客户首次对话的开场白和基本信息收集",
    updatedAt: "2025-05-10",
    updatedBy: "张经理",
    tags: ["开场白", "初次接触"],
    usage: 128,
  },
  {
    id: 2,
    title: "需求挖掘话术",
    description: "引导客户表达需求的问题和话术",
    updatedAt: "2025-05-12",
    updatedBy: "刘经理",
    tags: ["需求挖掘", "问题引导"],
    usage: 95,
  },
  {
    id: 3,
    title: "价格异议处理",
    description: "客户对价格提出异议时的应对话术",
    updatedAt: "2025-05-14",
    updatedBy: "王经理",
    tags: ["异议处理", "价格谈判"],
    usage: 76,
  },
  {
    id: 4,
    title: "竞品对比话术",
    description: "与竞争产品进行对比时的话术策略",
    updatedAt: "2025-05-13",
    updatedBy: "李经理",
    tags: ["竞品对比", "差异化"],
    usage: 62,
  },
  {
    id: 5,
    title: "促成交易话术",
    description: "引导客户做出购买决策的话术",
    updatedAt: "2025-05-11",
    updatedBy: "赵经理",
    tags: ["成交", "决策促进"],
    usage: 54,
  },
  {
    id: 6,
    title: "预约演示话术",
    description: "邀请客户参加产品演示的话术",
    updatedAt: "2025-05-09",
    updatedBy: "陈经理",
    tags: ["预约", "演示"],
    usage: 89,
  },
]

export function SalesScripts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {scriptItems.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-muted-foreground" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </div>
            </div>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {item.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                更新于 {item.updatedAt} 由 {item.updatedBy}
              </p>
              <Badge variant="outline">使用 {item.usage} 次</Badge>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              查看
            </Button>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

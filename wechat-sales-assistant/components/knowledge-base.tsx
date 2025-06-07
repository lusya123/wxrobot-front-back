import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Edit, Trash2, Eye } from "lucide-react"

const knowledgeItems = [
  {
    id: 1,
    title: "公司简介",
    description: "公司的基本信息、历史、愿景和使命",
    updatedAt: "2025-05-10",
    updatedBy: "张经理",
    tags: ["基础信息", "公司介绍"],
    type: "document",
  },
  {
    id: 2,
    title: "产品功能详解",
    description: "详细介绍产品的各项功能和使用场景",
    updatedAt: "2025-05-12",
    updatedBy: "刘经理",
    tags: ["产品信息", "功能介绍"],
    type: "document",
  },
  {
    id: 3,
    title: "常见问题解答",
    description: "客户常见问题及标准回答",
    updatedAt: "2025-05-14",
    updatedBy: "王经理",
    tags: ["FAQ", "客户支持"],
    type: "document",
  },
  {
    id: 4,
    title: "价格政策",
    description: "产品定价、折扣政策和付款方式",
    updatedAt: "2025-05-13",
    updatedBy: "李经理",
    tags: ["价格", "销售政策"],
    type: "document",
  },
  {
    id: 5,
    title: "竞品对比分析",
    description: "与主要竞争对手的产品对比和优势分析",
    updatedAt: "2025-05-11",
    updatedBy: "赵经理",
    tags: ["竞品分析", "销售策略"],
    type: "document",
  },
  {
    id: 6,
    title: "客户案例集",
    description: "成功客户案例和使用效果",
    updatedAt: "2025-05-09",
    updatedBy: "陈经理",
    tags: ["案例", "成功故事"],
    type: "document",
  },
]

export function KnowledgeBase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {knowledgeItems.map((item) => (
        <Card key={item.id} className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center mr-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </div>
            </div>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {item.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-muted/50 text-foreground/70 border-0">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              更新于 {item.updatedAt} 由 {item.updatedBy}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              查看
            </Button>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

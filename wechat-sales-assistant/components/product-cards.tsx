import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Edit, Trash2, Eye } from "lucide-react"

const productItems = [
  {
    id: 1,
    title: "智能销售助手 - 基础版",
    description: "AI驱动的销售助手基础功能套餐",
    price: "¥98/月/用户",
    features: ["自动回复", "基础知识库", "简单数据分析"],
    updatedAt: "2025-05-10",
    updatedBy: "张经理",
  },
  {
    id: 2,
    title: "智能销售助手 - 专业版",
    description: "AI驱动的销售助手专业功能套餐",
    price: "¥198/月/用户",
    features: ["高级AI对话", "完整知识库", "详细数据分析", "自动化工作流"],
    updatedAt: "2025-05-12",
    updatedBy: "刘经理",
  },
  {
    id: 3,
    title: "智能销售助手 - 企业版",
    description: "AI驱动的销售助手企业级功能套餐",
    price: "¥398/月/用户",
    features: ["全功能AI对话", "定制知识库", "高级数据分析", "完整API集成", "专属客户经理"],
    updatedAt: "2025-05-14",
    updatedBy: "王经理",
  },
  {
    id: 4,
    title: "数据分析插件",
    description: "销售数据高级分析和可视化工具",
    price: "¥50/月/用户",
    features: ["销售预测", "客户行为分析", "自定义报表"],
    updatedAt: "2025-05-13",
    updatedBy: "李经理",
  },
  {
    id: 5,
    title: "CRM集成模块",
    description: "与主流CRM系统的集成插件",
    price: "¥30/月/用户",
    features: ["数据同步", "自动更新", "统一界面"],
    updatedAt: "2025-05-11",
    updatedBy: "赵经理",
  },
  {
    id: 6,
    title: "培训服务包",
    description: "系统使用和销售技巧培训服务",
    price: "¥5000/次",
    features: ["系统操作培训", "销售话术指导", "最佳实践分享"],
    updatedAt: "2025-05-09",
    updatedBy: "陈经理",
  },
]

export function ProductCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {productItems.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-muted-foreground" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </div>
            </div>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="mb-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">{item.price}</Badge>
            </div>
            <div className="space-y-1 mb-2">
              {item.features.map((feature, index) => (
                <p key={index} className="text-sm">
                  • {feature}
                </p>
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

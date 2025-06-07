import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { KnowledgeBase } from "@/components/knowledge-base"
import { SalesScripts } from "@/components/sales-scripts"
import { ProductCards } from "@/components/product-cards"
import { KnowledgeTester } from "@/components/knowledge-tester"
import { Plus, Upload, Link, Search } from "lucide-react"

export default function KnowledgePage() {
  return (
    <div className="p-8 space-y-8 dashboard-gradient">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">知识库管理</h1>
          <p className="text-sm text-muted-foreground">管理和测试AI销售助手的知识库</p>
        </div>
        <div className="flex space-x-3">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建知识
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            上传文档
          </Button>
          <Button variant="outline">
            <Link className="h-4 w-4 mr-2" />
            导入链接
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索知识库..." className="pl-8" />
        </div>
      </div>

      <Tabs defaultValue="knowledge" className="space-y-6">
        <TabsList>
          <TabsTrigger value="knowledge">基础知识</TabsTrigger>
          <TabsTrigger value="scripts">话术模板</TabsTrigger>
          <TabsTrigger value="products">产品知识卡片</TabsTrigger>
          <TabsTrigger value="test">效果测试</TabsTrigger>
        </TabsList>
        <TabsContent value="knowledge">
          <KnowledgeBase />
        </TabsContent>
        <TabsContent value="scripts">
          <SalesScripts />
        </TabsContent>
        <TabsContent value="products">
          <ProductCards />
        </TabsContent>
        <TabsContent value="test">
          <KnowledgeTester />
        </TabsContent>
      </Tabs>
    </div>
  )
}

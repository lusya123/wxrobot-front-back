import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MoreHorizontal, Plus, Download, Filter } from "lucide-react"

const customers = [
  {
    id: 1,
    name: "李先生",
    company: "ABC科技有限公司",
    position: "销售总监",
    phone: "138****5678",
    source: "LinkedIn广告",
    status: "高意向",
    lastContact: "2025-05-14",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    name: "王总",
    company: "未来传媒集团",
    position: "CEO",
    phone: "139****1234",
    source: "行业展会",
    status: "已接洽",
    lastContact: "2025-05-13",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    name: "赵女士",
    company: "智慧教育科技",
    position: "采购经理",
    phone: "137****9876",
    source: "官网咨询",
    status: "已预约",
    lastContact: "2025-05-12",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 4,
    name: "陈先生",
    company: "环球贸易有限公司",
    position: "IT经理",
    phone: "136****5432",
    source: "朋友推荐",
    status: "需跟进",
    lastContact: "2025-05-11",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 5,
    name: "刘经理",
    company: "新星科技",
    position: "运营总监",
    phone: "135****6789",
    source: "百度搜索",
    status: "已成交",
    lastContact: "2025-05-10",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 6,
    name: "张女士",
    company: "创新软件公司",
    position: "人力资源总监",
    phone: "134****2345",
    source: "微信群",
    status: "低意向",
    lastContact: "2025-05-09",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 7,
    name: "吴总",
    company: "东方电子商务",
    position: "CEO",
    phone: "133****8765",
    source: "抖音广告",
    status: "高意向",
    lastContact: "2025-05-08",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "高意向":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">高意向</Badge>
    case "已接洽":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">已接洽</Badge>
    case "已预约":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">已预约</Badge>
    case "需跟进":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">需跟进</Badge>
    case "已成交":
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">已成交</Badge>
    case "低意向":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">低意向</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function CustomersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">客户管理</h1>
        <div className="flex space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新增客户
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索客户..." className="pl-8" />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          筛选
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客户</TableHead>
              <TableHead>公司</TableHead>
              <TableHead>职位</TableHead>
              <TableHead>联系方式</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最近联系</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={customer.avatar || "/placeholder.svg"} alt={customer.name} />
                      <AvatarFallback>{customer.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span>{customer.name}</span>
                  </div>
                </TableCell>
                <TableCell>{customer.company}</TableCell>
                <TableCell>{customer.position}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.source}</TableCell>
                <TableCell>{getStatusBadge(customer.status)}</TableCell>
                <TableCell>{customer.lastContact}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>查看详情</DropdownMenuItem>
                      <DropdownMenuItem>编辑信息</DropdownMenuItem>
                      <DropdownMenuItem>发起对话</DropdownMenuItem>
                      <DropdownMenuItem>添加备注</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">删除客户</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, CalendarIcon, List } from "lucide-react"
import { useState } from "react"

const appointments = [
  {
    id: 1,
    customer: {
      name: "李先生",
      company: "ABC科技有限公司",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    type: "产品演示",
    date: "2025-05-15",
    time: "10:00-11:00",
    salesperson: "张经理",
    status: "已确认",
  },
  {
    id: 2,
    customer: {
      name: "王总",
      company: "未来传媒集团",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    type: "需求沟通",
    date: "2025-05-15",
    time: "14:00-15:00",
    salesperson: "刘经理",
    status: "已确认",
  },
  {
    id: 3,
    customer: {
      name: "赵女士",
      company: "智慧教育科技",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    type: "产品演示",
    date: "2025-05-16",
    time: "11:00-12:00",
    salesperson: "王经理",
    status: "待确认",
  },
  {
    id: 4,
    customer: {
      name: "陈先生",
      company: "环球贸易有限公司",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    type: "方案讨论",
    date: "2025-05-17",
    time: "15:30-16:30",
    salesperson: "李经理",
    status: "已确认",
  },
  {
    id: 5,
    customer: {
      name: "刘经理",
      company: "新星科技",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    type: "价格谈判",
    date: "2025-05-18",
    time: "09:30-10:30",
    salesperson: "赵经理",
    status: "待确认",
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "已确认":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">已确认</Badge>
    case "待确认":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">待确认</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">预约管理</h1>
        <div className="flex space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新增预约
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              列表视图
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              日历视图
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-10 w-10 mt-1">
                      <AvatarImage
                        src={appointment.customer.avatar || "/placeholder.svg"}
                        alt={appointment.customer.name}
                      />
                      <AvatarFallback>{appointment.customer.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{appointment.customer.name}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.customer.company}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <Badge variant="outline">{appointment.type}</Badge>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{appointment.date}</p>
                    <p className="text-sm text-muted-foreground">{appointment.time}</p>
                    <p className="text-sm mt-1">负责人: {appointment.salesperson}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
            <Card>
              <CardHeader>
                <CardTitle>日历</CardTitle>
                <CardDescription>选择日期查看预约</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {date?.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                </CardTitle>
                <CardDescription>当日预约安排</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments
                    .filter((a) => a.date === "2025-05-15")
                    .map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="font-medium">{appointment.time}</div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={appointment.customer.avatar || "/placeholder.svg"}
                              alt={appointment.customer.name}
                            />
                            <AvatarFallback>{appointment.customer.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{appointment.customer.name}</div>
                            <div className="text-sm text-muted-foreground">{appointment.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center">{getStatusBadge(appointment.status)}</div>
                      </div>
                    ))}
                  {appointments.filter((a) => a.date === "2025-05-15").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">当日没有预约安排</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

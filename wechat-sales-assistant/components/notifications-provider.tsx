"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Bell } from "lucide-react"

type NotificationType = "takeover" | "appointment" | "customer" | "system"

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: Record<string, any>
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { toast } = useToast()

  const unreadCount = notifications.filter((n) => !n.read).length

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])

    toast({
      title: notification.title,
      description: notification.message,
      icon: <Bell className="h-4 w-4" />,
    })
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  // Mock notifications for demo
  useEffect(() => {
    const mockNotifications = [
      {
        type: "takeover" as NotificationType,
        title: "需要接管对话",
        message: "李先生(ABC科技)的对话需要人工接管",
        data: { conversationId: "1", customerId: "1" },
      },
      {
        type: "appointment" as NotificationType,
        title: "新预约提醒",
        message: "王总(未来传媒)预约了产品演示",
        data: { appointmentId: "2", customerId: "2" },
      },
      {
        type: "customer" as NotificationType,
        title: "新客户添加",
        message: "AI助手添加了新客户：赵女士(智慧教育)",
        data: { customerId: "3" },
      },
    ]

    // Add mock notifications with a delay
    setTimeout(() => {
      mockNotifications.forEach((notification, index) => {
        setTimeout(() => {
          addNotification(notification)
        }, index * 2000)
      })
    }, 3000)
  }, [])

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}

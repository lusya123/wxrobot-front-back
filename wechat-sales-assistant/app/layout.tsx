'use client'

import type React from "react"
import { cn } from "@/lib/utils"
import "@/app/globals.css"
import { Mona_Sans as FontSans } from "next/font/google"
import { ClientLayout } from "@/components/client-layout"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body 
        className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)} 
        suppressHydrationWarning
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}

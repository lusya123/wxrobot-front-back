'use client'

import { useRouter } from 'next/navigation'
import { MouseEventHandler, useCallback } from 'react'

interface RoutePreloaderProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetch?: boolean
}

export function RoutePreloader({ 
  href, 
  children, 
  className,
  prefetch = true 
}: RoutePreloaderProps) {
  const router = useRouter()

  const handleMouseEnter: MouseEventHandler = useCallback(() => {
    if (prefetch) {
      // 预加载路由
      router.prefetch(href)
    }
  }, [router, href, prefetch])

  const handleClick: MouseEventHandler = useCallback((e) => {
    e.preventDefault()
    router.push(href)
  }, [router, href])

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </div>
  )
} 
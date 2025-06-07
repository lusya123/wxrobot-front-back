'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  loadTime: number
  domContentLoaded: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  useEffect(() => {
    const measurePerformance = () => {
      // 获取 Navigation Timing API 数据
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.startTime
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.startTime
        
        setMetrics({
          loadTime,
          domContentLoaded,
        })
      }

      // 获取 Paint Timing API 数据
      const paintEntries = performance.getEntriesByType('paint')
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      
      // 获取 LCP (需要 Largest Contentful Paint API)
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            
            setMetrics(prev => ({
              ...prev!,
              largestContentfulPaint: lastEntry.startTime
            }))
          })
          
          observer.observe({ entryTypes: ['largest-contentful-paint'] })
          
          // 清理函数
          return () => observer.disconnect()
        } catch (error) {
          console.warn('LCP measurement not supported:', error)
        }
      }

      // 更新 FCP
      if (fcp) {
        setMetrics(prev => ({
          ...prev!,
          firstContentfulPaint: fcp.startTime
        }))
      }
    }

    // 页面加载完成后测量性能
    if (document.readyState === 'complete') {
      measurePerformance()
    } else {
      window.addEventListener('load', measurePerformance)
      return () => window.removeEventListener('load', measurePerformance)
    }
  }, [])

  // 开发环境下在控制台输出性能数据
  useEffect(() => {
    if (metrics && process.env.NODE_ENV === 'development') {
      console.group('🚀 页面性能指标')
      console.log(`📊 页面加载时间: ${metrics.loadTime.toFixed(2)}ms`)
      console.log(`📊 DOM 内容加载时间: ${metrics.domContentLoaded.toFixed(2)}ms`)
      if (metrics.firstContentfulPaint) {
        console.log(`📊 首次内容绘制 (FCP): ${metrics.firstContentfulPaint.toFixed(2)}ms`)
      }
      if (metrics.largestContentfulPaint) {
        console.log(`📊 最大内容绘制 (LCP): ${metrics.largestContentfulPaint.toFixed(2)}ms`)
      }
      console.groupEnd()
    }
  }, [metrics])

  return metrics
}

// 性能建议Hook
export function usePerformanceAdvice(metrics: PerformanceMetrics | null) {
  const [advice, setAdvice] = useState<string[]>([])

  useEffect(() => {
    if (!metrics) return

    const newAdvice: string[] = []

    // 根据性能指标给出优化建议
    if (metrics.loadTime > 3000) {
      newAdvice.push('页面加载时间超过3秒，建议优化资源加载')
    }

    if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 1800) {
      newAdvice.push('首次内容绘制时间较长，建议优化关键渲染路径')
    }

    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
      newAdvice.push('最大内容绘制时间较长，建议优化图片和主要内容加载')
    }

    setAdvice(newAdvice)
  }, [metrics])

  return advice
} 
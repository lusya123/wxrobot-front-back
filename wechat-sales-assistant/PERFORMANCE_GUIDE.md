# 🚀 性能优化指南

本指南介绍了项目中实施的各种性能优化方案，帮助解决首次页面加载缓慢的问题。

## 📊 已实施的优化方案

### 1. Next.js 配置优化
- ✅ 启用了 `optimizePackageImports` 对常用UI库进行优化
- ✅ 开启了 SWC 编译器和压缩
- ✅ 启用了字体优化
- ✅ 集成了 Bundle Analyzer

### 2. 组件懒加载
- ✅ 重型组件（图表、活动列表）采用懒加载
- ✅ 使用 `React.Suspense` 提供加载状态
- ✅ 自定义加载组件提升用户体验

### 3. 加载状态改进
- ✅ 全屏加载组件 `FullScreenLoading`
- ✅ 灵活的加载指示器 `LoadingSpinner`
- ✅ 错误状态处理和重试机制

### 4. 路由预加载
- ✅ `RoutePreloader` 组件实现鼠标悬停预加载
- ✅ 智能预加载重要页面资源

### 5. 性能监控
- ✅ `usePerformance` Hook 监控页面性能指标
- ✅ 自动化性能建议系统
- ✅ 开发环境性能数据输出

## 🛠️ 使用方法

### Bundle 分析

分析打包大小，找出性能瓶颈：

```bash
# 构建并分析 bundle
npm run analyze

# 开发模式下分析
npm run dev:analyze
```

### 性能监控

在组件中使用性能监控：

```tsx
import { usePerformance, usePerformanceAdvice } from '@/hooks/use-performance'

function MyComponent() {
  const metrics = usePerformance()
  const advice = usePerformanceAdvice(metrics)
  
  // 开发环境下会自动在控制台输出性能数据
  // 生产环境可以发送到监控服务
}
```

### 路由预加载

对重要页面启用预加载：

```tsx
import { RoutePreloader } from '@/components/route-preloader'

<RoutePreloader href="/important-page">
  <Button>重要页面</Button>
</RoutePreloader>
```

### 懒加载组件

对重型组件使用懒加载：

```tsx
import { Suspense, lazy } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

<Suspense fallback={<LoadingSpinner text="加载中..." />}>
  <HeavyComponent />
</Suspense>
```

## 📈 性能指标参考

### 良好的性能指标
- 🟢 首次内容绘制 (FCP): < 1.8秒
- 🟢 最大内容绘制 (LCP): < 2.5秒  
- 🟢 页面完全加载: < 3秒

### 需要优化的指标
- 🟡 FCP: 1.8-3秒
- 🟡 LCP: 2.5-4秒
- 🟡 页面加载: 3-5秒

### 较差的指标
- 🔴 FCP: > 3秒
- 🔴 LCP: > 4秒
- 🔴 页面加载: > 5秒

## 🔧 进一步优化建议

### 1. 代码分割
```tsx
// 按页面分割代码
const AdminPage = lazy(() => import('./admin/page'))
const DashboardPage = lazy(() => import('./dashboard/page'))

// 按功能分割代码  
const ChartComponents = lazy(() => import('./components/charts'))
```

### 2. 资源优化
- 使用 `next/image` 优化图片加载
- 实施服务端渲染 (SSR) 或静态生成 (SSG)
- 使用 CDN 加速静态资源

### 3. 缓存策略
```tsx
// API 请求缓存
const { data } = useSWR('/api/data', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
})

// 浏览器缓存
// 在 next.config.js 中配置
headers: async () => [
  {
    source: '/api/:path*',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=60',
      },
    ],
  },
]
```

### 4. 服务端优化
- 启用 gzip/brotli 压缩
- 使用 HTTP/2
- 实施 CDN 分发
- 数据库查询优化

## 📝 监控和持续优化

### 开发阶段
1. 定期运行 `npm run analyze` 检查 bundle 大小
2. 使用浏览器开发者工具的 Performance 面板
3. 关注控制台输出的性能指标

### 生产阶段
1. 集成真实用户监控 (RUM)
2. 设置性能预算和告警
3. 定期进行性能审计

## 🎯 性能优化检查清单

- [ ] 启用了 Next.js 性能优化配置
- [ ] 重型组件使用懒加载
- [ ] 实施了适当的加载状态
- [ ] 关键路由启用了预加载
- [ ] 集成了性能监控
- [ ] 定期进行 bundle 分析
- [ ] 图片使用了优化格式和尺寸
- [ ] API 请求实施了缓存策略
- [ ] 字体和样式经过优化
- [ ] 第三方脚本异步加载

通过以上优化方案，您的应用首次加载时间应该会显著改善。如果仍有性能问题，建议通过 bundle 分析找出具体的性能瓶颈进行针对性优化。 
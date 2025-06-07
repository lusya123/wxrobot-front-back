import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ 
  size = "default", 
  className,
  text = "加载中..." 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className={cn(
          "animate-spin rounded-full border-2 border-muted border-t-primary",
          sizeClasses[size],
          className
        )} />
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-transparent border-t-primary/20 animate-pulse",
          sizeClasses[size]
        )} />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  )
}

// 全屏加载组件
export function FullScreenLoading({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
} 
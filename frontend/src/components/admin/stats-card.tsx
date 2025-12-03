'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, Minus, LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon | React.ReactNode
  trend?: 'up' | 'down' | 'neutral' | {
    value: number
    label?: string
  }
  trendValue?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className,
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null

    // Handle string trend type
    if (typeof trend === 'string') {
      if (trend === 'up') return <ArrowUp className="h-4 w-4" />
      if (trend === 'down') return <ArrowDown className="h-4 w-4" />
      return <Minus className="h-4 w-4" />
    }

    // Handle object trend type
    if (trend.value > 0) return <ArrowUp className="h-4 w-4" />
    if (trend.value < 0) return <ArrowDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (!trend) return ''

    // Handle string trend type
    if (typeof trend === 'string') {
      if (trend === 'up') return 'text-green-600'
      if (trend === 'down') return 'text-red-600'
      return 'text-gray-500'
    }

    // Handle object trend type
    if (trend.value > 0) return 'text-green-600'
    if (trend.value < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  // Render icon - supports both component and ReactNode
  const renderIcon = () => {
    if (!icon) return null

    // Check if it's a React component (function or forwardRef object with $$typeof)
    // In React 19, forwardRef components are objects with {$$typeof, render} structure
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
      const IconComponent = icon as LucideIcon
      return <IconComponent className="h-4 w-4 text-muted-foreground" />
    }

    // It's already a ReactNode (JSX element)
    return <div className="text-muted-foreground">{icon}</div>
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate pr-2">
          {title}
        </CardTitle>
        {renderIcon()}
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        <div className="text-lg md:text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 md:gap-2 mt-1 flex-wrap">
          {trend && (
            <span className={cn('flex items-center text-xs font-medium', getTrendColor())}>
              {getTrendIcon()}
              {trendValue || (typeof trend === 'object' ? `${Math.abs(trend.value)}%` : '')}
              {typeof trend === 'object' && trend.label && (
                <span className="ml-1 text-muted-foreground">{trend.label}</span>
              )}
            </span>
          )}
          {description && (
            <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-primary',
  className,
}: StatsCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {change !== undefined && (
            <p
              className={cn(
                'mt-1 text-sm',
                change >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {change >= 0 ? '+' : ''}
              {change}% {changeLabel || 'from last period'}
            </p>
          )}
        </div>
        <div className={cn('rounded-lg bg-muted p-3', iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

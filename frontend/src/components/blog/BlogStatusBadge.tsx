import { cn } from '@/lib/utils'
import { BlogStatus } from '@/lib/api/blog'

interface BlogStatusBadgeProps {
  status: BlogStatus
  className?: string
}

const statusStyles: Record<BlogStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<BlogStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

export function BlogStatusBadge({ status, className }: BlogStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

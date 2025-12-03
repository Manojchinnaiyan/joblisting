import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  BriefcaseIcon,
  CheckCircle,
  XCircle,
  UserPlus,
  Star,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { Notification, NotificationType } from '@/lib/api/notifications'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: Notification
  compact?: boolean
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'APPLICATION_STATUS_CHANGE':
      return <CheckCircle className="h-5 w-5 text-blue-600" />
    case 'NEW_APPLICATION':
      return <BriefcaseIcon className="h-5 w-5 text-green-600" />
    case 'NEW_JOB_FROM_FOLLOWED_COMPANY':
      return <Bell className="h-5 w-5 text-purple-600" />
    case 'JOB_EXPIRING_SOON':
      return <AlertCircle className="h-5 w-5 text-orange-600" />
    case 'PROFILE_VIEWED':
      return <Eye className="h-5 w-5 text-gray-600" />
    case 'COMPANY_REVIEW_POSTED':
      return <Star className="h-5 w-5 text-yellow-600" />
    case 'TEAM_INVITATION':
      return <UserPlus className="h-5 w-5 text-indigo-600" />
    case 'JOB_APPROVED':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'JOB_REJECTED':
      return <XCircle className="h-5 w-5 text-red-600" />
    case 'COMPANY_VERIFIED':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'COMPANY_REJECTED':
      return <XCircle className="h-5 w-5 text-red-600" />
    default:
      return <Bell className="h-5 w-5 text-gray-600" />
  }
}

export function NotificationItem({ notification, compact = false }: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  return (
    <div
      className={cn(
        'flex gap-3 p-4 transition-colors',
        !notification.is_read && 'bg-blue-50/50 dark:bg-blue-950/20',
        compact && 'p-3'
      )}
    >
      <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('font-medium truncate', compact && 'text-sm')}>{notification.title}</p>
          {!notification.is_read && (
            <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
          )}
        </div>
        <p
          className={cn(
            'text-muted-foreground line-clamp-2',
            compact && 'text-xs',
            !compact && 'text-sm'
          )}
        >
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  )
}

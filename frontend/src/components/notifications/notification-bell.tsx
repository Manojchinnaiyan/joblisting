'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  useUnreadCount,
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/use-notifications'
import { NotificationItem } from './notification-item'

interface NotificationBellProps {
  notificationsHref?: string
}

export function NotificationBell({ notificationsHref = '/notifications' }: NotificationBellProps) {
  const router = useRouter()
  const { data: unreadCount } = useUnreadCount()
  const { data: notificationsData } = useNotifications(1, 5)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const hasUnread = unreadCount && unreadCount > 0

  const handleNotificationClick = (id: string, isRead: boolean, link?: string) => {
    if (!isRead) {
      markAsRead.mutate(id)
    }
    if (link) {
      router.push(link)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="h-auto py-1 px-2 text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {notificationsData?.notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notificationsData?.notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-0 focus:bg-accent"
                onClick={() =>
                  handleNotificationClick(notification.id, notification.is_read, notification.link)
                }
              >
                <NotificationItem notification={notification} compact />
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center">
          <Link href={notificationsHref} className="w-full text-center text-sm">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

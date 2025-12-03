'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Check, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useClearReadNotifications,
} from '@/hooks/use-notifications'
import { NotificationItem } from '@/components/notifications/notification-item'
import Link from 'next/link'

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useNotifications(page, 20)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotification = useDeleteNotification()
  const clearRead = useClearReadNotifications()

  const notifications = data?.notifications || []
  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  const handleNotificationClick = (id: string, link?: string, isRead?: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id)
    }
    if (link) {
      router.push(link)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your activity</p>
        </div>
        <Link href="/settings/notifications">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearRead.mutate()}
            disabled={clearRead.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear read
          </Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="group relative">
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.link,
                      notification.is_read
                    )
                  }
                >
                  <NotificationItem notification={notification} />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNotification.mutate(notification.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {data && data.pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {data.pagination.total_pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data.pagination.total_pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

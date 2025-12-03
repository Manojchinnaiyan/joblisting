'use client'

import { useState } from 'react'
import { Bell, Check, CheckCheck, Trash2, Building2, Briefcase, MessageSquare, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Mock notifications data - in a real app, this would come from an API
const mockNotifications = [
  {
    id: '1',
    type: 'company_verification',
    title: 'New company verification request',
    message: 'TechCorp Inc. has submitted documents for verification.',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: '2',
    type: 'job_approval',
    title: 'Job pending approval',
    message: 'Senior Developer position at StartupXYZ needs review.',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    type: 'review_flagged',
    title: 'Review flagged for moderation',
    message: 'A review for Acme Corp has been reported by users.',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: '4',
    type: 'company_verification',
    title: 'Company verification completed',
    message: 'InnovateTech has been successfully verified.',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: '5',
    type: 'job_approval',
    title: 'Job approved',
    message: 'Product Manager position at FinanceHub has been published.',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'company_verification':
      return Building2
    case 'job_approval':
      return Briefcase
    case 'review_flagged':
      return MessageSquare
    default:
      return AlertTriangle
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Stay updated with platform activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            Click on a notification to mark it as read
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                You&apos;re all caught up! Check back later for updates.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
                      notification.read
                        ? 'bg-background hover:bg-accent/50'
                        : 'bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900'
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        notification.read
                          ? 'bg-slate-100 dark:bg-slate-800'
                          : 'bg-blue-100 dark:bg-blue-900'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          notification.read
                            ? 'text-slate-600 dark:text-slate-400'
                            : 'text-blue-600 dark:text-blue-400'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={cn(
                              'font-medium',
                              !notification.read && 'text-blue-900 dark:text-blue-100'
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Lock,
  Monitor,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLoginHistory } from '@/hooks/admin/use-admin-analytics'

const STATUS_CONFIG = {
  SUCCESS: { label: 'Success', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
  FAILED: { label: 'Failed', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
  LOCKED: { label: 'Locked', variant: 'secondary' as const, icon: Lock, color: 'text-orange-600' },
}

export default function LoginHistoryPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [daysFilter, setDaysFilter] = useState(30)
  const limit = 20

  const { data, isLoading } = useLoginHistory({
    page,
    limit,
    status: statusFilter === 'all' ? '' : statusFilter,
    days: daysFilter,
  })

  if (isLoading) {
    return <LoginHistorySkeleton />
  }

  const history = data?.history || []
  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/security">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Login History
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {total.toLocaleString()} login attempts recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="LOCKED">Locked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(daysFilter)} onValueChange={(v) => { setDaysFilter(Number(v)); setPage(1) }}>
            <SelectTrigger className="w-36">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="hidden lg:table-cell">User Agent</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length > 0 ? (
                history.map((entry) => {
                  const statusConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.FAILED
                  const StatusIcon = statusConfig.icon
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {entry.user_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {entry.ip_address || '-'}
                        </code>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate">
                          {entry.user_agent || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        {entry.failure_reason ? (
                          <span className="text-xs text-red-600">{entry.failure_reason}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No login history found for the selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total.toLocaleString()} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function LoginHistorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

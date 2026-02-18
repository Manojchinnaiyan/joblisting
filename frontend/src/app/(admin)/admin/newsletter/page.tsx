'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Mail, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/admin/data-table'
import { useAdminNewsletterSubscribers } from '@/hooks/admin'
import { NewsletterSubscriber } from '@/lib/api/admin/newsletter'
import { toast } from 'sonner'

export default function NewsletterPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const { data, isLoading, refetch, isFetching } = useAdminNewsletterSubscribers({ page, limit })

  const copyAllEmails = () => {
    const emails = subscribers.map((s) => s.email).join(', ')
    navigator.clipboard.writeText(emails)
    toast.success(`Copied ${subscribers.length} emails to clipboard`)
  }

  const columns: ColumnDef<NewsletterSubscriber>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'subscribed_at',
      header: 'Subscribed',
      cell: ({ row }) => {
        const date = row.original.subscribed_at
        if (!date) return '-'
        try {
          const d = new Date(date)
          if (isNaN(d.getTime())) return '-'
          return format(d, 'MMM d, yyyy HH:mm')
        } catch {
          return '-'
        }
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">
          Active
        </Badge>
      ),
    },
  ]

  const subscribers = data?.subscribers || []
  const pagination = data
    ? { page, limit, total: data.total, totalPages: data.total_pages }
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View all active newsletter subscribers ({data?.total ?? 0} total)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyAllEmails}
            disabled={subscribers.length === 0}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy All Emails
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={subscribers}
        searchPlaceholder="Search subscribers..."
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={() => refetch()}
        isRefreshing={isFetching && !isLoading}
      />
    </div>
  )
}

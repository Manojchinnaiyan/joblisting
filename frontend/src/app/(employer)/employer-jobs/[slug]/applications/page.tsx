'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEmployerJob } from '@/hooks/employer/use-employer-jobs'
import { useJobApplications, useUpdateApplicationStatus } from '@/hooks/employer/use-employer-applications'
import { ApplicationStatus } from '@/lib/api/employer/applications'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const statusConfig = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  reviewed: { label: 'Reviewed', color: 'bg-yellow-100 text-yellow-800' },
  shortlisted: { label: 'Shortlisted', color: 'bg-purple-100 text-purple-800' },
  interview: { label: 'Interview', color: 'bg-indigo-100 text-indigo-800' },
  offered: { label: 'Offered', color: 'bg-green-100 text-green-800' },
  hired: { label: 'Hired', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
}

export default function JobApplicationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { data: job } = useEmployerJob(slug)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data: applicationsData, isLoading } = useJobApplications(slug, {
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter as ApplicationStatus : undefined,
    page,
    limit: 20,
  })

  const updateStatus = useUpdateApplicationStatus()

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    await updateStatus.mutateAsync({
      id: applicationId,
      data: { status: newStatus as ApplicationStatus },
    })
  }

  const applications = applicationsData?.applications || []
  const total = applicationsData?.total || 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/jobs/${slug}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Applications</h1>
            <p className="text-muted-foreground">
              {job?.title} • {total} application{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="offered">Offered</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pipeline Summary */}
      <div className="grid gap-2 grid-cols-4 md:grid-cols-8">
        {Object.entries(statusConfig).map(([key, config]) => {
          const statusKey = key as ApplicationStatus
          const count = applicationsData?.status_counts?.[statusKey] || 0
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'rounded-lg border p-2 text-center transition-colors hover:bg-muted',
                statusFilter === key && 'ring-2 ring-primary'
              )}
            >
              <div className="text-lg font-bold">{count}</div>
              <div className="text-xs text-muted-foreground truncate">{config.label}</div>
            </button>
          )
        })}
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No applications found</h3>
            <p className="mt-2 text-muted-foreground text-center">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Applications will appear here once candidates apply'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const status = statusConfig[application.status as keyof typeof statusConfig]

            return (
              <Card key={application.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    {/* Applicant Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={application.applicant_avatar} />
                        <AvatarFallback>
                          {application.applicant_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          href={`/employer-applications/${application.id}`}
                          className="font-semibold hover:underline truncate block"
                        >
                          {application.applicant_name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {application.applicant_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {application.applicant_email}
                            </span>
                          )}
                          {application.applicant_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {application.applicant_phone}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    {application.rating && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-4 w-4',
                              star <= application.rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                    )}

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={application.status}
                        onValueChange={(value) => handleStatusChange(application.id, value)}
                      >
                        <SelectTrigger className={cn('w-[140px]', status?.color)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="offered">Offered</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/employer-applications/${application.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Cover Letter Preview */}
                  {application.cover_letter && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {application.cover_letter}
                      </p>
                    </div>
                  )}

                  {/* Resume & Notes indicators */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {application.resume_url && (
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <FileText className="h-3 w-3" />
                        Resume
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {application.notes_count && application.notes_count > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {application.notes_count} note{application.notes_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(total / 20)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  Download,
  Mail,
  FileText,
  Star,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAllApplications, useUpdateApplicationStatus } from '@/hooks/employer/use-employer-applications'
import { useEmployerJobs } from '@/hooks/employer/use-employer-jobs'
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

export default function ApplicationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [jobFilter, setJobFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [page, setPage] = useState(1)

  const { data: jobsData } = useEmployerJobs({ limit: 100 })
  const { data: applicationsData, isLoading } = useAllApplications({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter as ApplicationStatus : undefined,
    sort: sortBy as 'newest' | 'oldest' | 'rating',
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Applications</h1>
          <p className="text-muted-foreground">
            {total} application{total !== 1 ? 's' : ''} across all jobs
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
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
            </SelectContent>
          </Select>

          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobsData?.jobs?.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid gap-2 grid-cols-4 md:grid-cols-8">
        {Object.entries(statusConfig).map(([key, config]) => {
          const statusKey = key as ApplicationStatus
          const count = applicationsData?.status_counts?.[statusKey] || 0
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key === statusFilter ? 'all' : key)}
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
              {search || statusFilter !== 'all' || jobFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Applications will appear here once candidates apply to your jobs'}
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
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
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
                        <p className="text-sm text-muted-foreground truncate">
                          Applied for{' '}
                          <Link
                            href={`/jobs/${application.job_id}`}
                            className="hover:underline text-primary"
                          >
                            {application.job_title}
                          </Link>
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                          </span>
                          {application.applicant_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {application.applicant_email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-4">
                      {application.rating ? (
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
                      ) : (
                        <span className="text-xs text-muted-foreground">Not rated</span>
                      )}
                    </div>

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

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/employer-applications/${application.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {application.resume_url && (
                            <DropdownMenuItem asChild>
                              <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-4 w-4" />
                                Download Resume
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${application.applicant_email}`}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Quick info */}
                  {(application.notes_count || application.cover_letter) && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
                      {application.notes_count && application.notes_count > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {application.notes_count} note{application.notes_count !== 1 ? 's' : ''}
                        </span>
                      )}
                      {application.cover_letter && (
                        <span className="truncate flex-1">
                          {application.cover_letter.slice(0, 100)}...
                        </span>
                      )}
                    </div>
                  )}
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

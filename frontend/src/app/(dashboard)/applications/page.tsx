'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApplications } from '@/hooks/use-applications'
import { format } from 'date-fns'
import type { ApplicationStatus } from '@/types/application'

const statusOptions: { value: ApplicationStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
]

const statusColors: Record<ApplicationStatus, string> = {
  SUBMITTED: 'bg-gray-100 text-gray-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
  SHORTLISTED: 'bg-purple-100 text-purple-800',
  INTERVIEW: 'bg-indigo-100 text-indigo-800',
  OFFERED: 'bg-green-100 text-green-800',
  HIRED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-orange-100 text-orange-800',
}

export default function ApplicationsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ApplicationStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useApplications(
    {
      status: status === 'ALL' ? undefined : status,
    },
    { page, per_page: 20 }
  )

  const allApplications = data?.applications || []
  const pagination = data?.pagination

  // Client-side search filtering
  const applications = search
    ? allApplications.filter((app) =>
        app.job?.title.toLowerCase().includes(search.toLowerCase()) ||
        app.job?.company_name.toLowerCase().includes(search.toLowerCase())
      )
    : allApplications

  if (isLoading && page === 1) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="text-muted-foreground mt-1">
          Track your job applications
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by job title or company..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as ApplicationStatus | 'ALL')
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {search || status !== 'ALL'
                ? 'No applications found'
                : 'No applications yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || status !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Start applying to jobs to track your progress here'}
            </p>
            {!search && status === 'ALL' && (
              <Button asChild>
                <Link href="/jobs">Browse Jobs</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <Link key={application.id} href={`/applications/${application.id}`}>
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {application.job?.company_logo_url && (
                      <img
                        src={application.job.company_logo_url}
                        alt={application.job.company_name}
                        className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {application.job?.title || 'Job Title'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {application.job?.company_name || 'Company'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        <span>
                          Applied {format(new Date(application.applied_at), 'MMM d, yyyy')}
                        </span>
                        {application.job?.location && (
                          <>
                            <span>•</span>
                            <span>{application.job.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[application.status]
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={!pagination.has_prev}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.has_next}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

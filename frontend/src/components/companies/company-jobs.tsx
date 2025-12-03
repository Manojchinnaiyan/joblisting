'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JobList } from '@/components/jobs/job-list'
import { JobSkeletonList } from '@/components/jobs/job-skeleton'
import { Pagination } from '@/components/shared/pagination'
import { companiesApi } from '@/lib/api/companies'
import { toast } from 'sonner'
import type { Job } from '@/types/job'
import type { Pagination as PaginationType } from '@/types/api'

interface CompanyJobsProps {
  companySlug: string
}

export function CompanyJobs({ companySlug }: CompanyJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true)
      try {
        const data = await companiesApi.getCompanyJobs(companySlug, {
          page: currentPage,
          per_page: 9,
        })
        setJobs(data.jobs)
        setPagination(data.pagination)
      } catch (error) {
        toast.error('Failed to load company jobs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [companySlug, currentPage])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <JobSkeletonList count={3} />
        ) : (
          <>
            <JobList jobs={jobs} />
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.total_pages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

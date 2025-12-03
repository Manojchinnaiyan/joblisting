'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, X } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { JobSearch } from '@/components/jobs/job-search'
import { JobFilters } from '@/components/jobs/job-filters'
import { JobList } from '@/components/jobs/job-list'
import { JobSkeletonList } from '@/components/jobs/job-skeleton'
import { Pagination } from '@/components/shared/pagination'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { jobsApi } from '@/lib/api/jobs'
import { toast } from 'sonner'
import type { Job, JobFilters as JobFiltersType } from '@/types/job'
import type { Pagination as PaginationType } from '@/types/api'

export default function JobsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [filters, setFilters] = useState<JobFiltersType>({
    location: searchParams.get('location') || undefined,
    category: searchParams.get('category') || undefined,
  })

  // Fetch category name when category filter is active
  useEffect(() => {
    const fetchCategoryName = async () => {
      if (filters.category) {
        try {
          const categories = await jobsApi.getCategories()
          const category = categories.find(c => c.slug === filters.category)
          setCategoryName(category?.name || null)
        } catch {
          setCategoryName(null)
        }
      } else {
        setCategoryName(null)
      }
    }
    fetchCategoryName()
  }, [filters.category])

  const clearCategoryFilter = () => {
    setFilters(prev => ({ ...prev, category: undefined }))
    router.push('/jobs')
  }

  const fetchJobs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const apiFilters: JobFiltersType = { ...filters }
      if (searchQuery) {
        apiFilters.q = searchQuery
      }
      const data = await jobsApi.getJobs(apiFilters, {
        page: currentPage,
        per_page: 12,
      })
      setJobs(data.jobs)
      setPagination(data.pagination)
    } catch (err) {
      setError('Failed to load jobs')
      toast.error('Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentPage, searchQuery])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleFiltersChange = (newFilters: JobFiltersType) => {
    // Extract q from filters and store separately
    const { q, ...otherFilters } = newFilters
    if (q !== undefined) {
      setSearchQuery(q)
    }
    setFilters(otherFilters)
    setCurrentPage(1)
  }

  return (
    <Container className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        {/* Category filter header */}
        {filters.category && (
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCategoryFilter}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              All Jobs
            </Button>
            <span className="text-muted-foreground">/</span>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              {categoryName || filters.category}
              <button
                onClick={clearCategoryFilter}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
          {categoryName ? `${categoryName} Jobs` : 'Find Your Next Job'}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex-1">
            <JobSearch defaultValue={searchQuery} onSearch={handleSearch} />
          </div>
          <JobFilters filters={{ ...filters, q: searchQuery || undefined }} onFiltersChange={handleFiltersChange} />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} retry={() => setCurrentPage(1)} />
      ) : isLoading ? (
        <JobSkeletonList count={12} />
      ) : (
        <>
          <JobList jobs={jobs} />
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-4 sm:mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.total_pages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </Container>
  )
}

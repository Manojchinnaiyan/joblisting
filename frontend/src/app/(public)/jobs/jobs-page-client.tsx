'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, X, LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { JobSearch } from '@/components/jobs/job-search'
import { JobFiltersSidebar } from '@/components/jobs/job-filters-sidebar'
import { JobList, ViewMode } from '@/components/jobs/job-list'
import { JobSkeletonList } from '@/components/jobs/job-skeleton'
import { Pagination } from '@/components/shared/pagination'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { jobsApi } from '@/lib/api/jobs'
import { toast } from 'sonner'
import type { Job, JobFilters as JobFiltersType } from '@/types/job'
import type { Pagination as PaginationType } from '@/types/api'

interface InitialJobsData {
  jobs: Job[]
  pagination: PaginationType
}

interface JobsPageClientProps {
  initialData: InitialJobsData | null
}

export function JobsPageClient({ initialData }: JobsPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>(initialData?.jobs || [])
  const [pagination, setPagination] = useState<PaginationType | null>(initialData?.pagination || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false)

  // Parse URL params for filters
  const getInitialFilters = useCallback((): JobFiltersType => {
    const initialFilters: JobFiltersType = {
      location: searchParams.get('location') || undefined,
      category: searchParams.get('category') || undefined,
    }

    // Parse experience_level from URL (can be single value or comma-separated)
    const experienceLevel = searchParams.get('experience_level')
    if (experienceLevel) {
      initialFilters.experience_level = experienceLevel.split(',') as any[]
    }

    // Parse job_type from URL (can be single value or comma-separated)
    const jobType = searchParams.get('job_type')
    if (jobType) {
      initialFilters.job_type = jobType.split(',') as any[]
    }

    // Parse workplace_type from URL
    const workplaceType = searchParams.get('workplace_type')
    if (workplaceType) {
      initialFilters.workplace_type = workplaceType.split(',') as any[]
    }

    return initialFilters
  }, [searchParams])

  const [filters, setFilters] = useState<JobFiltersType>(getInitialFilters)
  const [mobileFilters, setMobileFilters] = useState<JobFiltersType>(filters)

  // Check if there are any active filters (from state, not just URL)
  const hasActiveFilters = !!(
    filters.location ||
    filters.category ||
    filters.experience_level?.length ||
    filters.job_type?.length ||
    filters.workplace_type?.length
  )

  // Update filters when URL params change (e.g., clicking Fresher Jobs or Internships)
  useEffect(() => {
    const newFilters = getInitialFilters()
    setFilters(newFilters)
    setMobileFilters(newFilters)
    setSearchQuery(searchParams.get('q') || '')
    setCurrentPage(1)
  }, [searchParams, getInitialFilters])

  // Count active filters
  const activeFilterCount =
    (filters.job_type?.length || 0) +
    (filters.experience_level?.length || 0) +
    (filters.workplace_type?.length || 0) +
    (filters.location ? 1 : 0)

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
      const paginationParams = {
        page: currentPage,
        per_page: 12,
      }

      let data
      if (searchQuery?.trim()) {
        // Use Meilisearch for search queries (faster, typo-tolerant, better relevance)
        data = await jobsApi.searchJobs(searchQuery, apiFilters, paginationParams)
      } else {
        // Use regular DB query for browsing without search
        data = await jobsApi.getJobs(apiFilters, paginationParams)
      }

      setJobs(data.jobs)
      setPagination(data.pagination)
      setHasFetchedOnce(true)
    } catch (err) {
      setError('Failed to load jobs')
      toast.error('Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentPage, searchQuery])

  // Fetch jobs when search query, filters, or page changes
  useEffect(() => {
    // Always fetch if:
    // - there's a search query or active filters
    // - page > 1
    // - no initial data
    // - we've fetched before (user has interacted, so always refetch on changes)
    const shouldFetch = searchQuery?.trim() || hasActiveFilters || currentPage > 1 || !initialData || hasFetchedOnce
    if (shouldFetch) {
      fetchJobs()
    }
  }, [fetchJobs, searchQuery, hasActiveFilters, currentPage, initialData, hasFetchedOnce])

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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Sticky Header Section */}
      <div className="sticky top-16 z-40 bg-background">
        <Container className="py-3 sm:py-4">
          {/* Category filter header */}
          {filters.category && (
            <div className="flex items-center gap-3 mb-3">
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

          <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">
            {categoryName
              ? `${categoryName} Jobs`
              : filters.experience_level?.includes('ENTRY' as any)
                ? 'Fresher Jobs'
                : filters.job_type?.includes('INTERNSHIP' as any)
                  ? 'Internship Jobs'
                  : 'Find Your Next Job'}
          </h1>
          <JobSearch defaultValue={searchQuery} onSearch={handleSearch} />
        </Container>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <Container className="py-4">
          {/* Main Content with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Filters (hidden on mobile) */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-4 max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin">
                <JobFiltersSidebar
                  filters={{ ...filters, q: searchQuery || undefined }}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* View Toggle, Filter Button (mobile), and Results Count */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button */}
                  <Sheet
                    open={mobileFilterOpen}
                    onOpenChange={(open) => {
                      setMobileFilterOpen(open)
                      if (open) {
                        // Reset mobile filters to current filters when opening
                        setMobileFilters({ ...filters, q: searchQuery || undefined })
                      }
                    }}
                  >
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-0 flex flex-col">
                      <SheetHeader className="p-4 border-b">
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 p-4 overflow-y-auto">
                        <JobFiltersSidebar
                          filters={mobileFilters}
                          onFiltersChange={setMobileFilters}
                          className="border-0 p-0"
                        />
                      </div>
                      <div className="p-4 border-t bg-background">
                        <Button
                          className="w-full"
                          onClick={() => {
                            handleFiltersChange(mobileFilters)
                            setMobileFilterOpen(false)
                          }}
                        >
                          Apply Filters
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <div className="text-sm text-muted-foreground">
                    {pagination && (
                      <span>
                        {pagination.total} job{pagination.total !== 1 ? 's' : ''} found
                      </span>
                    )}
                  </div>
                </div>

                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as ViewMode)}
                  className="hidden sm:flex border rounded-lg p-1"
                >
                  <ToggleGroupItem value="list" aria-label="List view" className="h-8 w-8 p-0">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="grid" aria-label="Grid view" className="h-8 w-8 p-0">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {error ? (
                <ErrorState message={error} retry={() => fetchJobs()} />
              ) : isLoading ? (
                <JobSkeletonList count={12} />
              ) : (
                <>
                  <JobList jobs={jobs} viewMode={viewMode} />
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
            </main>
          </div>
        </Container>
      </div>
    </div>
  )
}

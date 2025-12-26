import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '@/lib/api/jobs'
import type { JobFilters } from '@/types/job'
import type { PaginationParams } from '@/types/api'

export function useJobs(filters?: JobFilters, pagination?: PaginationParams) {
  // Use Meilisearch when there's a search query for better search experience
  const hasSearchQuery = !!filters?.q?.trim()

  return useQuery({
    queryKey: ['jobs', hasSearchQuery ? 'search' : 'list', filters, pagination],
    queryFn: () => {
      if (hasSearchQuery) {
        // Use Meilisearch for search queries (faster, typo-tolerant, better relevance)
        return jobsApi.searchJobs(filters!.q!, filters, pagination)
      }
      // Use regular DB query for browsing without search
      return jobsApi.getJobs(filters, pagination)
    },
  })
}

export function useFeaturedJobs(limit: number = 6) {
  return useQuery({
    queryKey: ['jobs', 'featured', limit],
    queryFn: () => jobsApi.getFeaturedJobs(limit),
  })
}

export function useJob(slug: string) {
  return useQuery({
    queryKey: ['jobs', slug],
    queryFn: () => jobsApi.getJobBySlug(slug),
    enabled: !!slug,
  })
}

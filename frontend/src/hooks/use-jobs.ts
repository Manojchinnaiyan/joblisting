import { useQuery } from '@tanstack/react-query'
import { jobsApi } from '@/lib/api/jobs'
import type { JobFilters } from '@/types/job'
import type { PaginationParams } from '@/types/api'

export function useJobs(filters?: JobFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: ['jobs', filters, pagination],
    queryFn: () => jobsApi.getJobs(filters, pagination),
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

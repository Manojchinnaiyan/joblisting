import { useQuery } from '@tanstack/react-query'
import { companiesApi } from '@/lib/api/companies'
import type { CompanyFilters } from '@/types/company'
import type { PaginationParams } from '@/types/api'

export function useCompanies(filters?: CompanyFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: ['companies', filters, pagination],
    queryFn: () => companiesApi.getCompanies(filters, pagination),
  })
}

export function useFeaturedCompanies(limit: number = 6) {
  return useQuery({
    queryKey: ['companies', 'featured', limit],
    queryFn: () => companiesApi.getFeaturedCompanies(limit),
  })
}

export function useCompany(slug: string) {
  return useQuery({
    queryKey: ['companies', slug],
    queryFn: () => companiesApi.getCompanyBySlug(slug),
    enabled: !!slug,
  })
}

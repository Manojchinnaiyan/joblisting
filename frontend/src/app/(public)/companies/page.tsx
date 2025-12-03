'use client'

import { useState, useEffect, useCallback } from 'react'
import { Container } from '@/components/layout/container'
import { CompanySearch } from '@/components/companies/company-search'
import { CompanyList } from '@/components/companies/company-list'
import { Pagination } from '@/components/shared/pagination'
import { ErrorState } from '@/components/shared/error-state'
import { companiesApi } from '@/lib/api/companies'
import { toast } from 'sonner'
import type { Company, CompanyFilters } from '@/types/company'
import type { Pagination as PaginationType } from '@/types/api'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const filters: CompanyFilters = {}
      if (searchQuery) {
        filters.q = searchQuery
      }
      const data = await companiesApi.getCompanies(filters, {
        page: currentPage,
        per_page: 12,
      })
      setCompanies(data.companies)
      setPagination(data.pagination)
    } catch (err) {
      setError('Failed to load companies')
      toast.error('Failed to load companies')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Explore Companies</h1>
        <p className="text-muted-foreground mb-4">
          Discover companies hiring for your dream role
        </p>
        <CompanySearch defaultValue={searchQuery} onSearch={handleSearch} />
      </div>

      {error ? (
        <ErrorState message={error} retry={() => setCurrentPage(1)} />
      ) : isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <CompanyList companies={companies} />
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
    </Container>
  )
}

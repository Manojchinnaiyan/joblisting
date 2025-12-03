'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { CompanyCard } from '@/components/companies/company-card'
import { companiesApi } from '@/lib/api/companies'
import { toast } from 'sonner'
import type { Company } from '@/types/company'

export function FeaturedCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedCompanies = async () => {
      try {
        const data = await companiesApi.getFeaturedCompanies(6)
        setCompanies(data)
      } catch (error) {
        toast.error('Failed to load featured companies')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedCompanies()
  }, [])

  if (!isLoading && companies.length === 0) {
    return null
  }

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Companies</h2>
            <p className="text-muted-foreground mt-2">
              Explore opportunities at leading organizations
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/companies">
              View all companies
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

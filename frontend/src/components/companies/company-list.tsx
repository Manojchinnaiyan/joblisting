'use client'

import { CompanyCard } from './company-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Building2 } from 'lucide-react'
import type { Company } from '@/types/company'

interface CompanyListProps {
  companies: Company[]
}

export function CompanyList({ companies }: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-12 w-12" />}
        title="No companies found"
        description="Try adjusting your filters to find more companies."
      />
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  )
}

'use client'

import { SearchInput } from '@/components/shared/search-input'

interface CompanySearchProps {
  defaultValue?: string
  onSearch: (query: string) => void
}

export function CompanySearch({ defaultValue, onSearch }: CompanySearchProps) {
  return (
    <SearchInput
      placeholder="Search companies by name or industry..."
      defaultValue={defaultValue}
      onSearch={onSearch}
      className="max-w-2xl"
      debounce
      debounceMs={400}
    />
  )
}

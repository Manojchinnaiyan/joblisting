'use client'

import { SearchInput } from '@/components/shared/search-input'

interface JobSearchProps {
  defaultValue?: string
  onSearch: (query: string) => void
}

export function JobSearch({ defaultValue, onSearch }: JobSearchProps) {
  return (
    <SearchInput
      placeholder="Search jobs by title, company, or skills..."
      defaultValue={defaultValue}
      onSearch={onSearch}
      className="w-full"
      debounce
      debounceMs={400}
    />
  )
}

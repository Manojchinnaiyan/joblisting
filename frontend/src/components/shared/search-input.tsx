'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/posthog'

interface SearchInputProps {
  placeholder?: string
  defaultValue?: string
  onSearch: (query: string) => void
  className?: string
  showButton?: boolean
  debounce?: boolean
  debounceMs?: number
}

export function SearchInput({
  placeholder = 'Search...',
  defaultValue = '',
  onSearch,
  className,
  showButton = false,
  debounce = false,
  debounceMs = 300,
}: SearchInputProps) {
  const [query, setQuery] = useState(defaultValue)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setQuery(defaultValue)
  }, [defaultValue])

  // Debounced search function
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        onSearch(value)
      }, debounceMs)
    },
    [onSearch, debounceMs]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    if (debounce) {
      debouncedSearch(value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Cancel any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Track search event
    if (query.trim()) {
      trackEvent('search_performed', {
        query: query.trim(),
        query_length: query.trim().length,
      })
    }

    onSearch(query)
  }

  const handleClear = () => {
    // Cancel any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Track search clear
    trackEvent('search_cleared', {
      previous_query: query,
    })

    setQuery('')
    onSearch('')
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          className={cn('pl-9', query ? 'pr-9' : 'pr-3')}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {showButton && (
        <Button type="submit">
          Search
        </Button>
      )}
    </form>
  )
}

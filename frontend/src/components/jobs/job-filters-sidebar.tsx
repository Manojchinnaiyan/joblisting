'use client'

import { useState, useEffect } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { JOB_TYPES, EXPERIENCE_LEVELS, WORKPLACE_TYPES } from '@/lib/constants'
import type { JobFilters as JobFiltersType } from '@/types/job'
import { cn } from '@/lib/utils'

interface JobFiltersSidebarProps {
  filters: JobFiltersType
  onFiltersChange: (filters: JobFiltersType) => void
  className?: string
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold hover:text-primary transition-colors">
        {title}
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function JobFiltersSidebar({ filters, onFiltersChange, className }: JobFiltersSidebarProps) {
  const [localFilters, setLocalFilters] = useState<JobFiltersType>(filters)
  const [locationInput, setLocationInput] = useState(filters.location || '')

  // Sync local filters when parent filters change
  useEffect(() => {
    setLocalFilters(filters)
    setLocationInput(filters.location || '')
  }, [filters])

  const handleJobTypeChange = (jobType: string, checked: boolean) => {
    const currentTypes = localFilters.job_type || []
    const newJobTypes = checked
      ? [...currentTypes, jobType as any]
      : currentTypes.filter((t) => t !== jobType)

    const newFilters = { ...localFilters, job_type: newJobTypes.length > 0 ? newJobTypes : undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleExperienceLevelChange = (level: string, checked: boolean) => {
    const currentLevels = localFilters.experience_level || []
    const newLevels = checked
      ? [...currentLevels, level as any]
      : currentLevels.filter((l) => l !== level)

    const newFilters = { ...localFilters, experience_level: newLevels.length > 0 ? newLevels : undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleWorkplaceTypeChange = (type: string, checked: boolean) => {
    const currentTypes = localFilters.workplace_type || []
    const newTypes = checked
      ? [...currentTypes, type as any]
      : currentTypes.filter((t) => t !== type)

    const newFilters = { ...localFilters, workplace_type: newTypes.length > 0 ? newTypes : undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationInput(e.target.value)
  }

  const handleLocationBlur = () => {
    const newFilters = { ...localFilters, location: locationInput || undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLocationBlur()
    }
  }

  const clearFilters = () => {
    const emptyFilters: JobFiltersType = { q: filters.q }
    setLocalFilters(emptyFilters)
    setLocationInput('')
    onFiltersChange(emptyFilters)
  }

  // Count active filters (excluding search)
  const activeFilterCount =
    (filters.job_type?.length || 0) +
    (filters.experience_level?.length || 0) +
    (filters.workplace_type?.length || 0) +
    (filters.location ? 1 : 0)

  return (
    <div className={cn("bg-card border rounded-lg", className)}>
      {/* Sticky Filter Header */}
      <div className="sticky top-0 z-10 bg-card border-b rounded-t-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h2 className="font-semibold">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1 p-4">
          {/* Location Filter */}
          <FilterSection title="Location">
            <Input
              placeholder="Enter city or region"
              value={locationInput}
              onChange={handleLocationChange}
              onBlur={handleLocationBlur}
              onKeyDown={handleLocationKeyDown}
              className="h-9"
            />
          </FilterSection>

          <Separator />

          {/* Job Type Filter */}
          <FilterSection title="Job Type">
            <div className="space-y-2">
              {JOB_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sidebar-job-type-${type.value}`}
                    checked={localFilters.job_type?.includes(type.value as any) || false}
                    onCheckedChange={(checked) =>
                      handleJobTypeChange(type.value, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`sidebar-job-type-${type.value}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          <Separator />

          {/* Experience Level Filter */}
          <FilterSection title="Experience Level">
            <div className="space-y-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sidebar-exp-level-${level.value}`}
                    checked={localFilters.experience_level?.includes(level.value as any) || false}
                    onCheckedChange={(checked) =>
                      handleExperienceLevelChange(level.value, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`sidebar-exp-level-${level.value}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {level.label}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          <Separator />

          {/* Workplace Type Filter */}
          <FilterSection title="Workplace Type">
            <div className="space-y-2">
              {WORKPLACE_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sidebar-workplace-${type.value}`}
                    checked={localFilters.workplace_type?.includes(type.value as any) || false}
                    onCheckedChange={(checked) =>
                      handleWorkplaceTypeChange(type.value, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`sidebar-workplace-${type.value}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>
        </div>
    </div>
  )
}

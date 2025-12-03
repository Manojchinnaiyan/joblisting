'use client'

import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { JOB_TYPES, EXPERIENCE_LEVELS, WORKPLACE_TYPES } from '@/lib/constants'
import type { JobFilters as JobFiltersType } from '@/types/job'

interface JobFiltersProps {
  filters: JobFiltersType
  onFiltersChange: (filters: JobFiltersType) => void
}

export function JobFilters({ filters, onFiltersChange }: JobFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<JobFiltersType>(filters)

  // Sync local filters when parent filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleJobTypeChange = (jobType: string, checked: boolean) => {
    const currentTypes = localFilters.job_type || []
    const newJobTypes = checked
      ? [...currentTypes, jobType as any]
      : currentTypes.filter((t) => t !== jobType)

    setLocalFilters({ ...localFilters, job_type: newJobTypes.length > 0 ? newJobTypes : undefined })
  }

  const handleExperienceLevelChange = (level: string, checked: boolean) => {
    const currentLevels = localFilters.experience_level || []
    const newLevels = checked
      ? [...currentLevels, level as any]
      : currentLevels.filter((l) => l !== level)

    setLocalFilters({ ...localFilters, experience_level: newLevels.length > 0 ? newLevels : undefined })
  }

  const handleWorkplaceTypeChange = (type: string, checked: boolean) => {
    const currentTypes = localFilters.workplace_type || []
    const newTypes = checked
      ? [...currentTypes, type as any]
      : currentTypes.filter((t) => t !== type)

    setLocalFilters({ ...localFilters, workplace_type: newTypes.length > 0 ? newTypes : undefined })
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const clearFilters = () => {
    const emptyFilters: JobFiltersType = { q: filters.q, location: filters.location }
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
    setIsOpen(false)
  }

  // Count active filters (excluding search and location)
  const activeFilterCount =
    (filters.job_type?.length || 0) +
    (filters.experience_level?.length || 0) +
    (filters.workplace_type?.length || 0)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Filter Jobs</SheetTitle>
          <SheetDescription>
            Refine your job search with these filters
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-6 space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Job Type</h3>
            <div className="space-y-2">
              {JOB_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`job-type-${type.value}`}
                    checked={localFilters.job_type?.includes(type.value as any) || false}
                    onCheckedChange={(checked) =>
                      handleJobTypeChange(type.value, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`job-type-${type.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-sm font-semibold">Experience Level</h3>
            <div className="space-y-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exp-level-${level.value}`}
                    checked={localFilters.experience_level?.includes(level.value as any) || false}
                    onCheckedChange={(checked) =>
                      handleExperienceLevelChange(level.value, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`exp-level-${level.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {level.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-sm font-semibold">Workplace Type</h3>
            <div className="space-y-2">
              {WORKPLACE_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`workplace-${type.value}`}
                    checked={localFilters.workplace_type?.includes(type.value as any) || false}
                    onCheckedChange={(checked) =>
                      handleWorkplaceTypeChange(type.value, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`workplace-${type.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6 flex gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={clearFilters}>
            Clear all
          </Button>
          <Button className="flex-1" onClick={applyFilters}>
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

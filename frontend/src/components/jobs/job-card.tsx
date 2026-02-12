'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Bookmark, Briefcase } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SalaryDisplay } from './salary-display'
import { trackEvent } from '@/lib/posthog'
import type { Job } from '@/types/job'
import type { ViewMode } from './job-list'

function DefaultLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-10 w-10 sm:h-12 sm:w-12',
    lg: 'h-16 w-16',
  }
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-5 w-5 sm:h-6 sm:w-6',
    lg: 'h-8 w-8',
  }
  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-primary flex items-center justify-center shrink-0`}>
      <Briefcase className={`${iconSizes[size]} text-primary-foreground`} />
    </div>
  )
}

// Company logo with fallback to default on error
function CompanyLogo({
  src,
  alt,
  size = 'md'
}: {
  src: string | null | undefined
  alt: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hasError, setHasError] = useState(false)

  const sizeConfig = {
    sm: { width: 40, height: 40, className: 'rounded-lg object-contain shrink-0 w-9 h-9 sm:w-10 sm:h-10' },
    md: { width: 48, height: 48, className: 'rounded-lg object-contain shrink-0 w-10 h-10 sm:w-12 sm:h-12' },
    lg: { width: 64, height: 64, className: 'rounded-xl object-contain shrink-0 w-16 h-16' },
  }

  if (!src || hasError) {
    return <DefaultLogo size={size} />
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={sizeConfig[size].width}
      height={sizeConfig[size].height}
      className={sizeConfig[size].className}
      onError={() => setHasError(true)}
    />
  )
}

interface JobCardProps {
  job: Job
  onSave?: (jobId: string) => void
  viewMode?: ViewMode
  compact?: boolean
}

export function JobCard({ job, onSave, viewMode = 'grid', compact = false }: JobCardProps) {
  if (compact) {
    return <JobCardCompact job={job} />
  }
  if (viewMode === 'list') {
    return <JobCardListView job={job} onSave={onSave} />
  }
  return <JobCardGridView job={job} onSave={onSave} />
}

function JobCardListView({ job, onSave }: Omit<JobCardProps, 'viewMode'>) {
  const handleJobClick = () => {
    trackEvent('job_card_clicked', {
      job_id: job.id,
      job_title: job.title,
      company_name: job.company_name,
      job_type: job.job_type,
      workplace_type: job.workplace_type,
      location: job.location,
      view_mode: 'list',
    })
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    trackEvent(job.is_saved ? 'job_unsaved' : 'job_saved', {
      job_id: job.id,
      job_title: job.title,
      company_name: job.company_name,
    })
    onSave?.(job.id)
  }

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-5">
          {/* Company Logo */}
          <CompanyLogo src={job.company_logo_url} alt={job.company_name} size="lg" />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link href={`/jobs/${job.slug}`} target="_blank" rel="noopener noreferrer" onClick={handleJobClick}>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                    {job.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mt-1">{job.company_name}</p>
              </div>

              {/* Right Side - Salary & Save */}
              <div className="flex items-center gap-4 shrink-0">
                <SalaryDisplay salary={job.salary} className="text-base font-semibold hidden lg:block" />
                {onSave && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveClick}
                    className="h-9 w-9"
                  >
                    <Bookmark
                      className={`h-5 w-5 ${job.is_saved ? 'fill-current text-primary' : ''}`}
                    />
                  </Button>
                )}
              </div>
            </div>

            {/* Location & Tags Row */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5">
                  {job.job_type.replace('_', ' ')}
                </Badge>
                <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5">
                  {job.workplace_type}
                </Badge>
                <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5">
                  {job.experience_level}
                </Badge>
              </div>
            </div>

            {/* Salary for mobile */}
            <div className="lg:hidden mt-3">
              <SalaryDisplay salary={job.salary} className="text-sm font-semibold" />
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {job.skills.slice(0, 6).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs font-normal px-2.5 py-0.5">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 6 && (
                  <Badge variant="outline" className="text-xs font-normal text-muted-foreground px-2.5 py-0.5">
                    +{job.skills.length - 6}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function JobCardGridView({ job, onSave }: Omit<JobCardProps, 'viewMode'>) {
  const handleJobClick = () => {
    trackEvent('job_card_clicked', {
      job_id: job.id,
      job_title: job.title,
      company_name: job.company_name,
      job_type: job.job_type,
      workplace_type: job.workplace_type,
      location: job.location,
      view_mode: 'grid',
    })
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    trackEvent(job.is_saved ? 'job_unsaved' : 'job_saved', {
      job_id: job.id,
      job_title: job.title,
      company_name: job.company_name,
    })
    onSave?.(job.id)
  }

  return (
    <Card className="hover:shadow-md transition-shadow group min-h-[220px]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Company Logo */}
          <CompanyLogo src={job.company_logo_url} alt={job.company_name} size="md" />

          {/* Job Info */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link href={`/jobs/${job.slug}`} target="_blank" rel="noopener noreferrer" onClick={handleJobClick}>
                  <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1">
                    {job.title}
                  </h3>
                </Link>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{job.company_name}</p>
              </div>
              {onSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveClick}
                  className="shrink-0 h-8 w-8"
                >
                  <Bookmark
                    className={`h-4 w-4 ${job.is_saved ? 'fill-current text-primary' : ''}`}
                  />
                </Button>
              )}
            </div>

            {/* Description - truncated, hidden on very small screens */}
            {(job.short_description || job.description) && (
              <p className="hidden sm:block text-sm text-muted-foreground mt-2 line-clamp-2">
                {job.short_description || job.description}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3">
              <Badge variant="secondary" className="text-[10px] sm:text-xs font-normal px-1.5 sm:px-2">
                {job.job_type.replace('_', ' ')}
              </Badge>
              <Badge variant="secondary" className="text-[10px] sm:text-xs font-normal px-1.5 sm:px-2">
                {job.workplace_type}
              </Badge>
              <Badge variant="secondary" className="text-[10px] sm:text-xs font-normal px-1.5 sm:px-2">
                {job.experience_level}
              </Badge>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-none">{job.location}</span>
              </div>
              <SalaryDisplay salary={job.salary} className="text-xs sm:text-sm" />
            </div>

            {/* Skills - hidden on mobile, show fewer on tablet */}
            {job.skills && job.skills.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1.5 mt-3">
                {job.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs font-normal">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                    +{job.skills.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function JobCardCompact({ job }: { job: Job }) {
  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Company Logo */}
          <CompanyLogo src={job.company_logo_url} alt={job.company_name} size="sm" />

          {/* Job Info */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <Link href={`/jobs/${job.slug}`} target="_blank" rel="noopener noreferrer">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                {job.title}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground truncate">{job.company_name}</p>

            {/* Location & Salary */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{job.location}</span>
              </div>
              <SalaryDisplay salary={job.salary} className="text-xs" />
            </div>

            {/* Job Type Badge */}
            <div className="mt-2">
              <Badge variant="secondary" className="text-[10px] font-normal px-1.5">
                {job.job_type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

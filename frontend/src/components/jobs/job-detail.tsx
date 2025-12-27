'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPin, Clock, Briefcase, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SalaryDisplay } from './salary-display'
import { formatRelativeTime } from '@/lib/utils'
import type { Job } from '@/types/job'

function DefaultLogo() {
  return (
    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-primary flex items-center justify-center shrink-0">
      <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
    </div>
  )
}

function CompanyLogo({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return <DefaultLogo />
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={80}
      height={80}
      className="rounded object-contain w-16 h-16 sm:w-20 sm:h-20"
      onError={() => setHasError(true)}
    />
  )
}

interface JobDetailProps {
  job: Job
  mobileActions?: React.ReactNode
}

export function JobDetail({ job, mobileActions }: JobDetailProps) {
  return (
    <div className="space-y-4 sm:space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        <CompanyLogo src={job.company_logo_url} alt={job.company_name} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">{job.title}</h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mt-1 sm:mt-2">{job.company_name}</p>
        </div>
      </div>

      {/* Mobile Actions - Apply button right after title */}
      {mobileActions && (
        <div className="lg:hidden">
          {mobileActions}
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <Badge variant="secondary" className="text-xs sm:text-sm">{job.job_type.replace('_', ' ')}</Badge>
        <Badge variant="secondary" className="text-xs sm:text-sm">{job.workplace_type}</Badge>
        <Badge variant="secondary" className="text-xs sm:text-sm">{job.experience_level}</Badge>
        {job.is_featured && <Badge className="text-xs sm:text-sm">Featured</Badge>}
      </div>

      {/* Info Cards */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-2.5 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <MapPin className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Location</p>
                <p className="font-medium text-[11px] sm:text-sm break-words">{job.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2.5 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Briefcase className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Job Type</p>
                <p className="font-medium text-[11px] sm:text-sm break-words">{job.job_type.replace('_', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2.5 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Users className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Experience</p>
                <p className="font-medium text-[11px] sm:text-sm break-words">{job.experience_level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2.5 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">Posted</p>
                <p className="font-medium text-[11px] sm:text-sm break-words">{formatRelativeTime(job.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {job.salary && !job.salary.hidden && (
        <Card>
          <CardContent className="p-2.5 sm:p-4">
            <SalaryDisplay salary={job.salary} className="text-xs sm:text-lg font-semibold" />
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Required Skills - Show before description for better visibility */}
      {job.skills && job.skills.length > 0 && (
        <>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs sm:text-sm whitespace-normal break-words">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="overflow-hidden">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Job Description</h2>
        <div
          className="prose prose-sm sm:prose max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground overflow-hidden break-words [&_*]:break-words [&_*]:overflow-wrap-anywhere"
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
      </div>

      {job.benefits && job.benefits.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Benefits</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm sm:text-base">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useCompleteness } from '@/hooks/use-profile'

const sectionLinks: Record<string, string> = {
  basic_info: '/profile/edit',
  avatar: '/profile/edit',
  location: '/profile/edit',
  resume: '/resumes',
  experience: '/profile/experience',
  education: '/profile/education',
  skills: '/profile/skills',
  social_links: '/profile/edit',
  preferences: '/profile/edit',
}

const sectionLabels: Record<string, string> = {
  basic_info: 'Basic Information',
  avatar: 'Profile Photo',
  location: 'Location Details',
  resume: 'Resume Upload',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  social_links: 'Social Links',
  preferences: 'Job Preferences',
}

export function ProfileCompleteness() {
  const { data: completeness, isLoading } = useCompleteness()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Completeness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-32 w-32 bg-muted rounded-full mx-auto mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!completeness) return null

  const percentage = Math.round(completeness.overall_percentage)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Completeness</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Circular Progress */}
        <div className="relative mx-auto w-32 h-32 mb-6">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-muted stroke-current"
              strokeWidth="10"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            />
            <circle
              className="text-primary stroke-current"
              strokeWidth="10"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={`${percentage * 2.51} 251`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{percentage}%</span>
          </div>
        </div>

        <Progress value={percentage} className="mb-6" />

        {/* Section Breakdown */}
        <div className="space-y-2">
          {completeness.sections && Object.entries(completeness.sections).map(([key, isComplete]) => (
            <Link
              key={key}
              href={sectionLinks[key] || '/profile'}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <span className="text-sm">
                {sectionLabels[key] || key}
              </span>
              {isComplete ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
            </Link>
          ))}
        </div>

        {percentage < 100 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Complete your profile to increase visibility to employers
          </p>
        )}
      </CardContent>
    </Card>
  )
}

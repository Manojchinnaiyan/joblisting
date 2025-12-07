'use client'

import { JobScraper } from '@/components/admin/JobScraper'

export default function ScrapePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Job from URL</h1>
        <p className="text-muted-foreground mt-2">
          Automatically extract job details from any job posting URL using AI
        </p>
      </div>

      <JobScraper />
    </div>
  )
}

export interface Job {
  id: string
  title: string
  slug: string
  description: string
  short_description?: string
  company_name: string
  company_logo_url?: string
  job_type: JobType
  experience_level: ExperienceLevel
  workplace_type: WorkplaceType
  location: string
  city?: string
  country?: string
  salary?: Salary
  skills: string[]
  benefits: string[]
  status: JobStatus
  is_featured: boolean
  views_count: number
  applications_count: number
  published_at?: string
  expires_at?: string
  created_at: string
  is_saved?: boolean
  has_applied?: boolean
}

export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP'
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'
export type WorkplaceType = 'ONSITE' | 'REMOTE' | 'HYBRID'
export type JobStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'CLOSED'

export interface Salary {
  min?: number
  max?: number
  currency: string
  period: string
  hidden: boolean
}

export interface JobFilters {
  q?: string
  job_type?: JobType[]
  experience_level?: ExperienceLevel[]
  workplace_type?: WorkplaceType[]
  location?: string
  salary_min?: number
  salary_max?: number
  skills?: string[]
  category?: string
}

export interface JobsResponse {
  jobs: Job[]
  pagination: Pagination
  facets?: JobFacets
}

export interface JobFacets {
  job_types: FacetItem[]
  experience_levels: FacetItem[]
  workplace_types: FacetItem[]
  locations: FacetItem[]
}

export interface FacetItem {
  value: string
  count: number
}

import type { Pagination } from './api'
export type { Pagination }

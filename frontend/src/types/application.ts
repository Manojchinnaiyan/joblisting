export type ApplicationStatus =
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN'

export interface Application {
  id: string
  job_id: string
  user_id: string
  resume_id: string
  status: ApplicationStatus
  cover_letter?: string
  expected_salary?: number
  available_from?: string
  applied_at: string
  updated_at: string

  // Populated fields
  job?: {
    id: string
    title: string
    slug: string
    company_name: string
    company_logo_url?: string
    location?: string
    job_type?: string
    salary_min?: number
    salary_max?: number
    salary_currency?: string
  }

  resume?: {
    id: string
    title: string
    file_name: string
  }

  status_history?: ApplicationStatusHistory[]
}

export interface ApplicationStatusHistory {
  id: string
  application_id: string
  status: ApplicationStatus
  notes?: string
  changed_by?: string
  changed_at: string
}

export interface ApplicationFilters {
  status?: ApplicationStatus
  job_type?: string
  date_from?: string
  date_to?: string
}

export interface ApplyToJobRequest {
  resume_id: string
  cover_letter?: string
  expected_salary?: number
  available_from?: string
}

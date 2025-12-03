export interface UserProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
  headline?: string
  bio?: string
  phone?: string
  date_of_birth?: string

  // Location
  city?: string
  state?: string
  country?: string

  // Career
  current_title?: string
  current_company?: string
  years_of_experience?: number

  // Salary
  expected_salary_min?: number
  expected_salary_max?: number
  salary_currency?: string

  // Availability
  notice_period?: number
  available_from?: string
  open_to_opportunities: boolean

  // Preferences
  preferred_job_types?: string[]
  preferred_workplace_types?: string[]
  preferred_locations?: string[]

  // Social Links
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  website_url?: string

  // Privacy
  visibility: 'PUBLIC' | 'EMPLOYERS_ONLY' | 'PRIVATE'
  show_email: boolean
  show_phone: boolean

  // Metadata
  created_at: string
  updated_at: string
}

export interface ProfileCompleteness {
  overall_percentage: number
  sections: {
    basic_info: boolean
    avatar: boolean
    location: boolean
    resume: boolean
    experience: boolean
    education: boolean
    skills: boolean
    social_links: boolean
    preferences: boolean
  }
  missing_sections: string[]
}

export interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
  headline?: string
  bio?: string
  phone?: string
  date_of_birth?: string
  city?: string
  state?: string
  country?: string
  current_title?: string
  current_company?: string
  years_of_experience?: number
  expected_salary_min?: number
  expected_salary_max?: number
  salary_currency?: string
  notice_period?: number
  available_from?: string
  open_to_opportunities?: boolean
  preferred_job_types?: string[]
  preferred_workplace_types?: string[]
  preferred_locations?: string[]
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  website_url?: string
  visibility?: 'PUBLIC' | 'EMPLOYERS_ONLY' | 'PRIVATE'
  show_email?: boolean
  show_phone?: boolean
}

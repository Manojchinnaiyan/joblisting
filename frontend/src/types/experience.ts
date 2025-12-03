export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERNSHIP'
  | 'FREELANCE'

export interface WorkExperience {
  id: string
  user_id: string
  company_name: string
  title: string
  employment_type: EmploymentType
  location?: string
  is_remote: boolean
  start_date: string
  end_date?: string
  is_current: boolean
  description?: string
  achievements?: string[]
  skills_used?: string[]
  created_at: string
  updated_at: string
}

export interface CreateExperienceRequest {
  company_name: string
  title: string
  employment_type: EmploymentType
  location?: string
  is_remote: boolean
  start_date: string
  end_date?: string
  is_current: boolean
  description?: string
  achievements?: string[]
  skills_used?: string[]
}

export interface UpdateExperienceRequest extends CreateExperienceRequest {}

export type DegreeType =
  | 'HIGH_SCHOOL'
  | 'ASSOCIATE'
  | 'BACHELOR'
  | 'MASTER'
  | 'DOCTORATE'
  | 'CERTIFICATE'
  | 'DIPLOMA'
  | 'OTHER'

export interface Education {
  id: string
  user_id: string
  institution_name: string
  degree_type: DegreeType
  field_of_study?: string
  degree_name?: string
  start_date: string
  end_date?: string
  is_current: boolean
  grade?: string
  gpa?: number
  max_gpa?: number
  description?: string
  achievements?: string[]
  location?: string
  duration_years?: number
  created_at: string
  updated_at: string
}

export interface CreateEducationRequest {
  institution_name: string
  degree_type: DegreeType
  field_of_study?: string
  degree_name?: string
  start_date: string
  end_date?: string
  is_current: boolean
  grade?: string
  gpa?: number
  max_gpa?: number
  description?: string
  achievements?: string[]
  location?: string
}

export interface UpdateEducationRequest {
  institution_name?: string
  degree_type?: DegreeType
  field_of_study?: string
  degree_name?: string
  start_date?: string
  end_date?: string
  is_current?: boolean
  grade?: string
  gpa?: number
  max_gpa?: number
  description?: string
  achievements?: string[]
  location?: string
}

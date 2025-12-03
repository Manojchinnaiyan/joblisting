export interface PortfolioProject {
  id: string
  user_id: string
  title: string
  description: string
  project_url?: string
  source_code_url?: string
  thumbnail_url?: string
  images?: string[]
  technologies: string[]
  start_date?: string
  end_date?: string
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface CreateProjectRequest {
  title: string
  description: string
  project_url?: string
  source_code_url?: string
  technologies: string[]
  start_date?: string
  end_date?: string
  is_featured?: boolean
}

export interface UpdateProjectRequest extends CreateProjectRequest {}

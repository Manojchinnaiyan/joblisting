export interface Company {
  id: string
  name: string
  slug: string
  tagline?: string
  description?: string
  industry: string
  company_size: CompanySize
  founded_year?: number
  logo_url?: string
  cover_image_url?: string
  website?: string
  is_verified: boolean
  is_featured: boolean
  active_jobs: number
  followers_count: number
  reviews_count: number
  average_rating: number
  social_links?: SocialLinks
  is_following?: boolean
  locations?: CompanyLocation[]
  benefits?: CompanyBenefit[]
  media?: CompanyMedia[]
  created_at: string
}

export interface CompanyMedia {
  id: string
  company_id: string
  type: 'IMAGE' | 'VIDEO'
  url: string
  thumbnail_url?: string
  title?: string
  description?: string
  sort_order: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001-5000' | '5000+'

export interface SocialLinks {
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  instagram_url?: string
}

export interface CompanyLocation {
  id: string
  name: string
  address: string
  city: string
  state?: string
  country: string
  is_headquarters: boolean
  is_hiring: boolean
}

export interface CompanyBenefit {
  id: string
  title: string
  description?: string
  category: BenefitCategory
  icon?: string
}

export type BenefitCategory = 'HEALTH' | 'FINANCIAL' | 'VACATION' | 'PROFESSIONAL_DEVELOPMENT' | 'OFFICE_PERKS' | 'FAMILY' | 'WELLNESS' | 'OTHER'

export interface CompanyReview {
  id: string
  overall_rating: number
  culture_rating?: number
  work_life_rating?: number
  compensation_rating?: number
  management_rating?: number
  title: string
  pros: string
  cons: string
  job_title?: string
  is_anonymous: boolean
  is_current_employee: boolean
  author?: ReviewAuthor
  company_response?: CompanyResponse
  helpful_count: number
  is_helpful?: boolean
  created_at: string
}

export interface ReviewAuthor {
  first_name: string
  last_name: string
  avatar_url?: string
}

export interface CompanyResponse {
  response: string
  responded_by: string
  responded_at: string
}

export interface CompanyFilters {
  q?: string
  industry?: string[]
  company_size?: CompanySize[]
  is_verified?: boolean
}

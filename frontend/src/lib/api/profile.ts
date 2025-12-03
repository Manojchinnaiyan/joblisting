import apiClient from './client'
import { UserProfile, ProfileCompleteness, UpdateProfileRequest } from '@/types/profile'

interface BackendProfileResponse {
  id: string
  user_id: string
  headline?: string
  bio?: string
  avatar_url?: string
  city?: string
  state?: string
  country?: string
  phone?: string
  date_of_birth?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  total_experience_years?: number
  desired_salary_min?: number
  desired_salary_max?: number
  willing_to_relocate?: boolean
  open_to_remote?: boolean
  available_from?: string
  preferred_job_types?: string[]
  preferred_work_locations?: string[]
  completeness_score?: number
  visibility: string
  show_email: boolean
  show_phone: boolean
  open_to_opportunities: boolean
  profile_views?: number
  created_at: string
  updated_at: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    full_name: string
    role: string
  }
}

export const profileApi = {
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<{ data: BackendProfileResponse }>('/jobseeker/me/profile')
    const data = response.data.data

    // Transform backend response to frontend UserProfile format
    // Convert null values to undefined to avoid React warnings
    return {
      id: data.id,
      user_id: data.user_id,
      first_name: data.user.first_name || '',
      last_name: data.user.last_name || '',
      email: data.user.email || '',
      avatar_url: data.avatar_url || undefined,
      headline: data.headline || undefined,
      bio: data.bio || undefined,
      phone: data.phone || undefined,
      date_of_birth: data.date_of_birth || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      current_title: undefined,
      current_company: undefined,
      years_of_experience: data.total_experience_years || undefined,
      expected_salary_min: data.desired_salary_min || undefined,
      expected_salary_max: data.desired_salary_max || undefined,
      salary_currency: 'USD',
      notice_period: undefined,
      available_from: data.available_from || undefined,
      open_to_opportunities: data.open_to_opportunities ?? false,
      preferred_job_types: data.preferred_job_types || undefined,
      preferred_workplace_types: data.preferred_work_locations || undefined,
      preferred_locations: undefined,
      linkedin_url: data.linkedin_url || undefined,
      github_url: data.github_url || undefined,
      portfolio_url: data.portfolio_url || undefined,
      website_url: undefined,
      visibility: data.visibility as 'PUBLIC' | 'EMPLOYERS_ONLY' | 'PRIVATE',
      show_email: data.show_email,
      show_phone: data.show_phone,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await apiClient.put<{ data: BackendProfileResponse }>('/jobseeker/me/profile', data)
    const responseData = response.data.data

    // Transform backend response to frontend UserProfile format
    return {
      id: responseData.id,
      user_id: responseData.user_id,
      first_name: responseData.user.first_name || '',
      last_name: responseData.user.last_name || '',
      email: responseData.user.email || '',
      avatar_url: responseData.avatar_url || undefined,
      headline: responseData.headline || undefined,
      bio: responseData.bio || undefined,
      phone: responseData.phone || undefined,
      date_of_birth: responseData.date_of_birth || undefined,
      city: responseData.city || undefined,
      state: responseData.state || undefined,
      country: responseData.country || undefined,
      current_title: undefined,
      current_company: undefined,
      years_of_experience: responseData.total_experience_years || undefined,
      expected_salary_min: responseData.desired_salary_min || undefined,
      expected_salary_max: responseData.desired_salary_max || undefined,
      salary_currency: 'USD',
      notice_period: undefined,
      available_from: responseData.available_from || undefined,
      open_to_opportunities: responseData.open_to_opportunities ?? false,
      preferred_job_types: responseData.preferred_job_types || undefined,
      preferred_workplace_types: responseData.preferred_work_locations || undefined,
      preferred_locations: undefined,
      linkedin_url: responseData.linkedin_url || undefined,
      github_url: responseData.github_url || undefined,
      portfolio_url: responseData.portfolio_url || undefined,
      website_url: undefined,
      visibility: responseData.visibility as 'PUBLIC' | 'EMPLOYERS_ONLY' | 'PRIVATE',
      show_email: responseData.show_email,
      show_phone: responseData.show_phone,
      created_at: responseData.created_at,
      updated_at: responseData.updated_at,
    }
  },

  getCompleteness: async (): Promise<ProfileCompleteness> => {
    const response = await apiClient.get<{ data: any }>('/jobseeker/me/profile/completeness')
    const data = response.data.data

    // Transform backend response to frontend format
    // Backend returns sections as a map of section names to objects with score/weight
    // Frontend expects sections as a map of section names to booleans
    const getSectionComplete = (key: string) => {
      return data.sections?.[key]?.is_complete || false
    }

    return {
      overall_percentage: data.percentage || 0,
      sections: {
        basic_info: getSectionComplete('basic_info'),
        avatar: getSectionComplete('avatar'),
        location: getSectionComplete('location'),
        resume: getSectionComplete('resume'),
        experience: getSectionComplete('experience'),
        education: getSectionComplete('education'),
        skills: getSectionComplete('skills'),
        social_links: getSectionComplete('social_links'),
        preferences: getSectionComplete('preferences'),
      },
      missing_sections: data.missing_sections || [],
    }
  },

  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<{ data: BackendProfileResponse }>(
      '/jobseeker/me/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    // Return just the avatar_url from the response
    return {
      avatar_url: response.data.data.avatar_url || ''
    }
  },

  deleteAvatar: async (): Promise<void> => {
    await apiClient.delete('/jobseeker/me/avatar')
  },
}

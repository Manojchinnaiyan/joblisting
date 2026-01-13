import axios from 'axios'
import { UserProfile, ProfileCompleteness, UpdateProfileRequest } from '@/types/profile'
import { useAuthStore } from '@/store/auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

// Helper to get auth header
const getAuthHeader = () => {
  const token = useAuthStore.getState().accessToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const profileApi = {
  // Get current user's profile
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await axios.get(`${API_URL}/jobseeker/me/profile`, {
      headers: getAuthHeader(),
    })

    const data = response.data.data

    return {
      id: data.id,
      user_id: data.user_id,
      first_name: data.user?.first_name || '',
      last_name: data.user?.last_name || '',
      email: data.user?.email || '',
      avatar_url: data.avatar_url || undefined,
      headline: data.headline || undefined,
      bio: data.bio || undefined,
      phone: data.phone || undefined,
      date_of_birth: data.date_of_birth || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      current_title: data.current_title || undefined,
      current_company: data.current_company || undefined,
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
      website_url: data.website_url || undefined,
      visibility: (data.visibility as 'PUBLIC' | 'PRIVATE') || 'PUBLIC',
      show_email: data.show_email ?? false,
      show_phone: data.show_phone ?? false,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  },

  // Update profile
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    // Build request body with backend field names
    const body: Record<string, unknown> = {}

    if (data.first_name !== undefined) body.first_name = data.first_name
    if (data.last_name !== undefined) body.last_name = data.last_name
    if (data.headline !== undefined) body.headline = data.headline
    if (data.bio !== undefined) body.bio = data.bio
    if (data.phone !== undefined) body.phone = data.phone
    if (data.date_of_birth !== undefined) body.date_of_birth = data.date_of_birth
    if (data.city !== undefined) body.city = data.city
    if (data.state !== undefined) body.state = data.state
    if (data.country !== undefined) body.country = data.country
    if (data.current_title !== undefined) body.current_title = data.current_title
    if (data.current_company !== undefined) body.current_company = data.current_company
    if (data.years_of_experience !== undefined) body.total_experience_years = data.years_of_experience
    if (data.expected_salary_min !== undefined) body.desired_salary_min = data.expected_salary_min
    if (data.expected_salary_max !== undefined) body.desired_salary_max = data.expected_salary_max
    if (data.available_from !== undefined) body.available_from = data.available_from
    if (data.open_to_opportunities !== undefined) body.open_to_opportunities = data.open_to_opportunities
    if (data.preferred_job_types !== undefined) body.preferred_job_types = data.preferred_job_types
    if (data.preferred_workplace_types !== undefined) body.preferred_work_locations = data.preferred_workplace_types
    if (data.linkedin_url !== undefined) body.linkedin_url = data.linkedin_url
    if (data.github_url !== undefined) body.github_url = data.github_url
    if (data.portfolio_url !== undefined) body.portfolio_url = data.portfolio_url
    if (data.website_url !== undefined) body.website_url = data.website_url
    if (data.visibility !== undefined) body.visibility = data.visibility
    if (data.show_email !== undefined) body.show_email = data.show_email
    if (data.show_phone !== undefined) body.show_phone = data.show_phone

    const response = await axios.put(`${API_URL}/jobseeker/me/profile`, body, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    })

    const resData = response.data.data

    return {
      id: resData.id,
      user_id: resData.user_id,
      first_name: resData.user?.first_name || '',
      last_name: resData.user?.last_name || '',
      email: resData.user?.email || '',
      avatar_url: resData.avatar_url || undefined,
      headline: resData.headline || undefined,
      bio: resData.bio || undefined,
      phone: resData.phone || undefined,
      date_of_birth: resData.date_of_birth || undefined,
      city: resData.city || undefined,
      state: resData.state || undefined,
      country: resData.country || undefined,
      current_title: resData.current_title || undefined,
      current_company: resData.current_company || undefined,
      years_of_experience: resData.total_experience_years || undefined,
      expected_salary_min: resData.desired_salary_min || undefined,
      expected_salary_max: resData.desired_salary_max || undefined,
      salary_currency: 'USD',
      notice_period: undefined,
      available_from: resData.available_from || undefined,
      open_to_opportunities: resData.open_to_opportunities ?? false,
      preferred_job_types: resData.preferred_job_types || undefined,
      preferred_workplace_types: resData.preferred_work_locations || undefined,
      preferred_locations: undefined,
      linkedin_url: resData.linkedin_url || undefined,
      github_url: resData.github_url || undefined,
      portfolio_url: resData.portfolio_url || undefined,
      website_url: resData.website_url || undefined,
      visibility: (resData.visibility as 'PUBLIC' | 'PRIVATE') || 'PUBLIC',
      show_email: resData.show_email ?? false,
      show_phone: resData.show_phone ?? false,
      created_at: resData.created_at,
      updated_at: resData.updated_at,
    }
  },

  // Get profile completeness
  getCompleteness: async (): Promise<ProfileCompleteness> => {
    const response = await axios.get(`${API_URL}/jobseeker/me/profile/completeness`, {
      headers: getAuthHeader(),
    })

    const data = response.data.data

    return {
      overall_percentage: data.percentage || 0,
      sections: {
        basic_info: data.sections?.basic_info?.is_complete || false,
        avatar: data.sections?.avatar?.is_complete || false,
        location: data.sections?.location?.is_complete || false,
        resume: data.sections?.resume?.is_complete || false,
        experience: data.sections?.work_experience?.is_complete || false,
        education: data.sections?.education?.is_complete || false,
        skills: data.sections?.skills?.is_complete || false,
        social_links: data.sections?.social_links?.is_complete || false,
        preferences: data.sections?.job_preferences?.is_complete || false,
      },
      missing_sections: data.missing_sections || [],
    }
  },

  // Upload avatar - uses FormData with multipart/form-data
  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post(`${API_URL}/jobseeker/me/avatar`, formData, {
      headers: {
        ...getAuthHeader(),
        // Do NOT set Content-Type - axios will set it with boundary for FormData
      },
    })

    return {
      avatar_url: response.data.data.avatar_url || '',
    }
  },

  // Delete avatar
  deleteAvatar: async (): Promise<void> => {
    await axios.delete(`${API_URL}/jobseeker/me/avatar`, {
      headers: getAuthHeader(),
    })
  },
}

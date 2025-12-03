import { apiClient } from '../client'

export interface Company {
  id: string
  name: string
  slug: string
  tagline?: string
  description?: string
  logo_url?: string
  cover_image_url?: string
  industry?: string
  sub_industry?: string
  company_size?: string
  founded_year?: number
  company_type?: string
  website?: string
  email?: string
  phone?: string
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  instagram_url?: string
  mission?: string
  vision?: string
  culture_description?: string
  brand_color?: string
  status?: string
  is_verified: boolean
  verified_at?: string
  is_featured?: boolean
  featured_until?: string
  total_jobs?: number
  active_jobs?: number
  total_employees?: number
  followers_count: number
  reviews_count: number
  average_rating?: number
  created_at: string
  updated_at: string
}

export interface CreateCompanyData {
  name: string
  industry?: string
  company_size?: string
  description?: string
  website?: string
  email?: string
  phone?: string
}

export interface UpdateCompanyData {
  name?: string
  tagline?: string
  description?: string
  industry?: string
  sub_industry?: string
  company_size?: string
  founded_year?: number
  company_type?: string
  website?: string
  email?: string
  phone?: string
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  instagram_url?: string
  mission?: string
  vision?: string
  culture_description?: string
  brand_color?: string
}

export interface VerificationStatus {
  status: 'none' | 'pending' | 'verified' | 'rejected'
  submitted_at?: string
  verified_at?: string
  verified_by?: string
  rejection_reason?: string
  documents: VerificationDocument[]
}

export interface VerificationDocument {
  id: string
  name: string
  type: string
  url: string
  uploaded_at: string
}

export interface RequestVerificationData {
  documents: File[]
  business_registration_number?: string
  additional_info?: string
}

export const employerCompanyApi = {
  async createCompany(data: CreateCompanyData): Promise<Company> {
    const response = await apiClient.post('/employer/company', data)
    // Backend returns CompanyResponse directly
    return response.data.data || response.data
  },

  async getMyCompany(): Promise<Company | null> {
    try {
      const response = await apiClient.get('/employer/company')
      // Backend returns CompanyResponse directly
      return response.data.data || response.data
    } catch (error: any) {
      // Check for 404 - company not found (user needs to create one)
      // The error could be from axios (error.response.status) or from our interceptor (error.code)
      const status = error.response?.status || error.status
      const errorCode = error.code || error.response?.data?.error?.code

      if (status === 404 || errorCode === 'COMPANY_NOT_FOUND' || error.message?.includes('not found')) {
        return null
      }
      throw error
    }
  },

  async updateCompany(data: UpdateCompanyData): Promise<Company> {
    const response = await apiClient.put('/employer/company', data)
    // Backend returns CompanyResponse directly
    return response.data.data || response.data
  },

  async deleteCompany(): Promise<void> {
    await apiClient.delete('/employer/company')
  },

  async uploadLogo(file: File): Promise<{ logo_url: string }> {
    const formData = new FormData()
    formData.append('logo', file)
    const response = await apiClient.post('/employer/company/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // Backend returns { success, message, data: { logo_url } }
    const apiData = response.data.data || response.data
    return { logo_url: apiData.logo_url || apiData.url }
  },

  async deleteLogo(): Promise<void> {
    await apiClient.delete('/employer/company/logo')
  },

  async uploadCover(file: File): Promise<{ cover_image_url: string }> {
    const formData = new FormData()
    formData.append('cover', file)
    const response = await apiClient.post('/employer/company/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // Backend returns { success, message, data: { cover_image_url } }
    const apiData = response.data.data || response.data
    return { cover_image_url: apiData.cover_image_url || apiData.url }
  },

  async deleteCover(): Promise<void> {
    await apiClient.delete('/employer/company/cover')
  },

  async requestVerification(data: RequestVerificationData): Promise<VerificationStatus> {
    const formData = new FormData()
    data.documents.forEach((doc, index) => {
      formData.append(`documents[${index}]`, doc)
    })
    if (data.business_registration_number) {
      formData.append('business_registration_number', data.business_registration_number)
    }
    if (data.additional_info) {
      formData.append('additional_info', data.additional_info)
    }
    const response = await apiClient.post('/employer/company/verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.verification
  },

  async getVerificationStatus(): Promise<VerificationStatus> {
    const response = await apiClient.get('/employer/company/verification')
    return response.data.verification
  },
}

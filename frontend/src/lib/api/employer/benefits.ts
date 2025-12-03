import { apiClient } from '../client'

export type BenefitCategory =
  | 'HEALTH'
  | 'FINANCIAL'
  | 'VACATION'
  | 'PROFESSIONAL_DEVELOPMENT'
  | 'OFFICE_PERKS'
  | 'FAMILY'
  | 'WELLNESS'
  | 'OTHER'

export interface CompanyBenefit {
  id: string
  company_id: string
  title: string
  description?: string
  category: BenefitCategory
  icon?: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface CreateBenefitData {
  title: string
  description?: string
  category: BenefitCategory
  icon?: string
}

export interface UpdateBenefitData {
  title?: string
  description?: string
  category?: BenefitCategory
  icon?: string
}

export interface ReorderBenefitsData {
  order: { id: string; display_order: number }[]
}

export const employerBenefitsApi = {
  async getBenefits(): Promise<CompanyBenefit[]> {
    const response = await apiClient.get('/employer/company/benefits')
    // Backend returns { success, message, data: { benefits } }
    const apiData = response.data.data || response.data
    return apiData.benefits ?? []
  },

  async createBenefit(data: CreateBenefitData): Promise<CompanyBenefit> {
    const response = await apiClient.post('/employer/company/benefits', data)
    const apiData = response.data.data || response.data
    return apiData.benefit
  },

  async updateBenefit(id: string, data: UpdateBenefitData): Promise<CompanyBenefit> {
    const response = await apiClient.put(`/employer/company/benefits/${id}`, data)
    const apiData = response.data.data || response.data
    return apiData.benefit
  },

  async deleteBenefit(id: string): Promise<void> {
    await apiClient.delete(`/employer/company/benefits/${id}`)
  },

  async reorderBenefits(data: ReorderBenefitsData): Promise<CompanyBenefit[]> {
    const response = await apiClient.put('/employer/company/benefits/reorder', data)
    const apiData = response.data.data || response.data
    return apiData.benefits ?? []
  },
}

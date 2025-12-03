import { apiClient } from '../client'

export interface CompanyLocation {
  id: string
  company_id: string
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone?: string
  email?: string
  is_headquarters: boolean
  is_hiring: boolean
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

export interface CreateLocationData {
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone?: string
  email?: string
  is_headquarters?: boolean
  is_hiring?: boolean
}

export interface UpdateLocationData {
  name?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone?: string
  email?: string
  is_headquarters?: boolean
  is_hiring?: boolean
}

export const employerLocationsApi = {
  async getLocations(): Promise<CompanyLocation[]> {
    const response = await apiClient.get('/employer/company/locations')
    // Backend returns { success, message, data: { locations } }
    const apiData = response.data.data || response.data
    return apiData.locations ?? []
  },

  async createLocation(data: CreateLocationData): Promise<CompanyLocation> {
    const response = await apiClient.post('/employer/company/locations', data)
    const apiData = response.data.data || response.data
    return apiData.location
  },

  async updateLocation(id: string, data: UpdateLocationData): Promise<CompanyLocation> {
    const response = await apiClient.put(`/employer/company/locations/${id}`, data)
    const apiData = response.data.data || response.data
    return apiData.location
  },

  async deleteLocation(id: string): Promise<void> {
    await apiClient.delete(`/employer/company/locations/${id}`)
  },
}

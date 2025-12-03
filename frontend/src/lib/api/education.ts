import apiClient from './client'
import { Education, CreateEducationRequest, UpdateEducationRequest } from '@/types/education'

export const educationApi = {
  getEducation: async (): Promise<Education[]> => {
    const response = await apiClient.get<{ data: { education: Education[] } }>('/jobseeker/me/education')
    return response.data.data.education
  },

  getEducationById: async (id: string): Promise<Education> => {
    const response = await apiClient.get<{ data: { education: Education } }>(
      `/jobseeker/me/education/${id}`
    )
    return response.data.data.education
  },

  createEducation: async (data: CreateEducationRequest): Promise<Education> => {
    const response = await apiClient.post<{ data: { education: Education } }>(
      '/jobseeker/me/education',
      data
    )
    return response.data.data.education
  },

  updateEducation: async (id: string, data: UpdateEducationRequest): Promise<Education> => {
    const response = await apiClient.put<{ data: { education: Education } }>(
      `/jobseeker/me/education/${id}`,
      data
    )
    return response.data.data.education
  },

  deleteEducation: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobseeker/me/education/${id}`)
  },
}

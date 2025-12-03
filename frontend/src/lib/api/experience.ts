import apiClient from './client'
import {
  WorkExperience,
  CreateExperienceRequest,
  UpdateExperienceRequest,
} from '@/types/experience'

export const experienceApi = {
  getExperiences: async (): Promise<WorkExperience[]> => {
    const response = await apiClient.get<{ data: { experiences: WorkExperience[] } }>(
      '/jobseeker/me/experiences'
    )
    return response.data.data.experiences
  },

  getExperience: async (id: string): Promise<WorkExperience> => {
    const response = await apiClient.get<{ data: { experience: WorkExperience } }>(
      `/jobseeker/me/experiences/${id}`
    )
    return response.data.data.experience
  },

  createExperience: async (data: CreateExperienceRequest): Promise<WorkExperience> => {
    const response = await apiClient.post<{ data: { experience: WorkExperience } }>(
      '/jobseeker/me/experiences',
      data
    )
    return response.data.data.experience
  },

  updateExperience: async (
    id: string,
    data: UpdateExperienceRequest
  ): Promise<WorkExperience> => {
    const response = await apiClient.put<{ data: { experience: WorkExperience } }>(
      `/jobseeker/me/experiences/${id}`,
      data
    )
    return response.data.data.experience
  },

  deleteExperience: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobseeker/me/experiences/${id}`)
  },
}

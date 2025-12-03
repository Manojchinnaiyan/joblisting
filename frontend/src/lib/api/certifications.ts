import apiClient from './client'
import {
  Certification,
  CreateCertificationRequest,
  UpdateCertificationRequest,
} from '@/types/certification'

export const certificationsApi = {
  getCertifications: async (): Promise<Certification[]> => {
    const response = await apiClient.get<{ data: { certifications: Certification[] } }>(
      '/jobseeker/me/certifications'
    )
    return response.data.data.certifications
  },

  createCertification: async (data: CreateCertificationRequest): Promise<Certification> => {
    const response = await apiClient.post<{ data: { certification: Certification } }>(
      '/jobseeker/me/certifications',
      data
    )
    return response.data.data.certification
  },

  updateCertification: async (
    id: string,
    data: UpdateCertificationRequest
  ): Promise<Certification> => {
    const response = await apiClient.put<{ data: { certification: Certification } }>(
      `/jobseeker/me/certifications/${id}`,
      data
    )
    return response.data.data.certification
  },

  deleteCertification: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobseeker/me/certifications/${id}`)
  },
}

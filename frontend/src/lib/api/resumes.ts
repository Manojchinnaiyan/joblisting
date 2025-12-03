import apiClient from './client'
import { Resume, UpdateResumeRequest } from '@/types/resume'

export const resumesApi = {
  getMyResumes: async (): Promise<Resume[]> => {
    const response = await apiClient.get<{ resumes: Resume[] }>('/jobseeker/me/resumes')
    return response.data.resumes ?? []
  },

  uploadResume: async (file: File, title: string): Promise<Resume> => {
    const formData = new FormData()
    formData.append('resume', file)
    formData.append('title', title)

    const response = await apiClient.post<{ resume: Resume }>(
      '/jobseeker/me/resumes',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.resume
  },

  getResume: async (id: string): Promise<Resume> => {
    const response = await apiClient.get<{ resume: Resume }>(`/jobseeker/me/resumes/${id}`)
    return response.data.resume
  },

  updateResume: async (id: string, data: UpdateResumeRequest): Promise<Resume> => {
    const response = await apiClient.put<{ resume: Resume }>(
      `/jobseeker/me/resumes/${id}`,
      data
    )
    return response.data.resume
  },

  deleteResume: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobseeker/me/resumes/${id}`)
  },

  setPrimaryResume: async (id: string): Promise<Resume> => {
    const response = await apiClient.put<{ resume: Resume }>(
      `/jobseeker/me/resumes/${id}/primary`
    )
    return response.data.resume
  },

  getResumeDownloadUrl: async (id: string): Promise<string> => {
    const response = await apiClient.get<{ download_url: string }>(
      `/jobseeker/me/resumes/${id}/download`
    )
    return response.data.download_url
  },
}

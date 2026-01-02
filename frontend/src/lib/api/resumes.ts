import apiClient from './client'
import { Resume, UpdateResumeRequest } from '@/types/resume'

// Backend wraps all responses in { success, message, data }
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const resumesApi = {
  getMyResumes: async (): Promise<Resume[]> => {
    const response = await apiClient.get<ApiResponse<{ resumes: Resume[] }>>('/jobseeker/me/resumes')
    return response.data.data?.resumes ?? []
  },

  uploadResume: async (file: File, title: string): Promise<Resume> => {
    const formData = new FormData()
    formData.append('file', file)  // Backend expects 'file' field name
    formData.append('title', title)

    const response = await apiClient.post<ApiResponse<{ resume: Resume }>>(
      '/jobseeker/me/resumes',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.data.resume
  },

  getResume: async (id: string): Promise<Resume> => {
    const response = await apiClient.get<ApiResponse<{ resume: Resume }>>(`/jobseeker/me/resumes/${id}`)
    return response.data.data.resume
  },

  updateResume: async (id: string, data: UpdateResumeRequest): Promise<Resume> => {
    const response = await apiClient.put<ApiResponse<{ resume: Resume }>>(
      `/jobseeker/me/resumes/${id}`,
      data
    )
    return response.data.data.resume
  },

  deleteResume: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobseeker/me/resumes/${id}`)
  },

  setPrimaryResume: async (id: string): Promise<void> => {
    await apiClient.put(`/jobseeker/me/resumes/${id}/primary`)
  },

  getResumeDownloadUrl: async (id: string): Promise<string> => {
    const response = await apiClient.get<ApiResponse<{ download_url: string }>>(
      `/jobseeker/me/resumes/${id}/download`
    )
    return response.data.data.download_url
  },
}

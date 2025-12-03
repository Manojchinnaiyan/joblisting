import apiClient from './client'
import { PortfolioProject, CreateProjectRequest, UpdateProjectRequest } from '@/types/portfolio'

export const portfolioApi = {
  getPortfolio: async (): Promise<PortfolioProject[]> => {
    const response = await apiClient.get<{ data: { projects: PortfolioProject[] } }>(
      '/jobseeker/me/portfolio'
    )
    return response.data.data.projects
  },

  createProject: async (data: CreateProjectRequest): Promise<PortfolioProject> => {
    const response = await apiClient.post<{ data: { project: PortfolioProject } }>(
      '/jobseeker/me/portfolio',
      data
    )
    return response.data.data.project
  },

  updateProject: async (id: string, data: UpdateProjectRequest): Promise<PortfolioProject> => {
    const response = await apiClient.put<{ data: { project: PortfolioProject } }>(
      `/jobseeker/me/portfolio/${id}`,
      data
    )
    return response.data.data.project
  },

  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobseeker/me/portfolio/${id}`)
  },

  setFeatured: async (id: string, featured: boolean): Promise<void> => {
    await apiClient.put(
      `/jobseeker/me/portfolio/${id}/featured`,
      { is_featured: featured }
    )
  },
}

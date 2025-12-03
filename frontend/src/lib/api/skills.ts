import apiClient from './client'
import { Skill, CreateSkillRequest, UpdateSkillRequest, BulkUpdateSkillsRequest } from '@/types/skill'

export const skillsApi = {
  getSkills: async (): Promise<Skill[]> => {
    const response = await apiClient.get<{ data: { skills: Skill[] } }>('/jobseeker/me/skills')
    return response.data.data.skills
  },

  addSkill: async (data: CreateSkillRequest): Promise<Skill> => {
    const response = await apiClient.post<{ data: { skill: Skill } }>('/jobseeker/me/skills', data)
    return response.data.data.skill
  },

  updateSkill: async (id: string, data: UpdateSkillRequest): Promise<Skill> => {
    const response = await apiClient.put<{ data: { skill: Skill } }>(`/jobseeker/me/skills/${id}`, data)
    return response.data.data.skill
  },

  deleteSkill: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobseeker/me/skills/${id}`)
  },

  bulkUpdateSkills: async (data: BulkUpdateSkillsRequest): Promise<Skill[]> => {
    const response = await apiClient.post<{ data: { skills: Skill[] } }>('/jobseeker/me/skills/bulk', data)
    return response.data.data.skills
  },
}

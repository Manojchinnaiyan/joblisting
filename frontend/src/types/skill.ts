export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'

export interface Skill {
  id: string
  user_id: string
  name: string
  level: SkillLevel
  years_experience?: number
  created_at: string
  updated_at: string
}

export interface CreateSkillRequest {
  name: string
  level: SkillLevel
  years_experience?: number
}

export interface UpdateSkillRequest extends CreateSkillRequest {}

export interface BulkUpdateSkillsRequest {
  skills: CreateSkillRequest[]
}

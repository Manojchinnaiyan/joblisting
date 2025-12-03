import { apiClient } from '../client'

export interface Candidate {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email?: string
  avatar_url?: string
  headline?: string
  location?: string
  years_of_experience?: number
  skills: string[]
  is_open_to_work: boolean
  is_saved?: boolean
  availability?: string
  created_at: string
}

export interface CandidateProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  avatar_url?: string
  headline?: string
  bio?: string
  location?: string
  website?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  years_of_experience?: number
  skills: string[]
  is_open_to_work: boolean
  is_saved?: boolean
  availability?: string
  expected_salary_min?: number
  expected_salary_max?: number
  expected_salary_currency?: string
  preferred_job_types: string[]
  preferred_workplace_types: string[]
  preferred_locations: string[]
  experiences: CandidateExperience[]
  education: CandidateEducation[]
  certifications: CandidateCertification[]
  portfolio_items: CandidatePortfolioItem[]
  resume_url?: string
}

export interface CandidateExperience {
  id: string
  title: string
  company: string
  location?: string
  start_date: string
  end_date?: string
  is_current: boolean
  description?: string
}

export interface CandidateEducation {
  id: string
  degree: string
  field_of_study?: string
  school: string
  start_date?: string
  end_date?: string
  grade?: string
}

export interface CandidateCertification {
  id: string
  name: string
  issuing_organization: string
  issue_date?: string
  expiry_date?: string
  credential_id?: string
  credential_url?: string
}

export interface CandidatePortfolioItem {
  id: string
  title: string
  description?: string
  url?: string
  image_url?: string
}

export interface SavedCandidate {
  id: string
  candidate_id: string
  candidate: Candidate
  notes?: string
  folder?: string
  saved_at: string
}

export interface SearchCandidatesParams {
  keywords?: string
  skills?: string[]
  location?: string
  years_experience_min?: number
  years_experience_max?: number
  availability?: string
  page?: number
  limit?: number
}

export interface CandidatesResponse {
  candidates: Candidate[]
  total: number
  page: number
  limit: number
}

export interface SavedCandidatesResponse {
  candidates: SavedCandidate[]
  total: number
  page: number
  limit: number
}

export interface SaveCandidateData {
  candidate_id: string
  notes?: string
  folder?: string
}

export interface UpdateSavedCandidateData {
  notes?: string
  folder?: string
}

export const employerCandidatesApi = {
  async searchCandidates(params: SearchCandidatesParams = {}): Promise<CandidatesResponse> {
    const response = await apiClient.get('/employer/candidates', { params })
    return response.data
  },

  async getCandidateProfile(id: string): Promise<CandidateProfile> {
    const response = await apiClient.get(`/employer/candidates/${id}`)
    return response.data.candidate
  },

  async getSavedCandidates(params: { page?: number; limit?: number } = {}): Promise<SavedCandidatesResponse> {
    const response = await apiClient.get('/employer/saved-candidates', { params })
    return response.data
  },

  async saveCandidate(data: SaveCandidateData): Promise<SavedCandidate> {
    const response = await apiClient.post('/employer/saved-candidates', data)
    return response.data.saved_candidate
  },

  async removeSavedCandidate(id: string): Promise<void> {
    await apiClient.delete(`/employer/saved-candidates/${id}`)
  },

  async updateSavedCandidateNotes(id: string, data: UpdateSavedCandidateData): Promise<SavedCandidate> {
    const response = await apiClient.put(`/employer/saved-candidates/${id}`, data)
    return response.data.saved_candidate
  },

  async getCandidateNotes(candidateId: string): Promise<{ notes: string[] }> {
    const response = await apiClient.get(`/employer/candidates/${candidateId}/notes`)
    return response.data
  },

  async addCandidateNote(candidateId: string, note: string): Promise<{ note: string }> {
    const response = await apiClient.post(`/employer/candidates/${candidateId}/notes`, { note })
    return response.data
  },
}

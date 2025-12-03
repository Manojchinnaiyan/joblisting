import { apiClient } from '../client'

export type ApplicationStatus =
  | 'submitted'
  | 'reviewed'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

export interface ApplicationAnswer {
  question: string
  answer: string
}

export interface Application {
  id: string
  job_id: string
  job_title: string
  user_id: string
  applicant_name: string
  applicant_email: string
  applicant_phone?: string
  applicant_avatar?: string
  applicant_headline?: string
  applicant_location?: string
  linkedin_url?: string
  portfolio_url?: string
  resume_url?: string
  cover_letter?: string
  expected_salary?: number
  expected_salary_currency?: string
  available_from?: string
  status: ApplicationStatus
  employer_notes?: string
  rating?: number
  match_score?: number
  custom_answers?: Record<string, string>
  answers?: ApplicationAnswer[]
  skills?: string[]
  notes_count?: number
  status_history?: StatusHistoryEntry[]
  applied_at: string
  reviewed_at?: string
  updated_at: string
}

export interface StatusHistoryEntry {
  status: ApplicationStatus
  changed_at: string
  changed_by?: string
  reason?: string
}

export interface ApplicantProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
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
  experiences: ProfileExperience[]
  education: ProfileEducation[]
  certifications: ProfileCertification[]
  languages: ProfileLanguage[]
  resume_url?: string
}

export interface ProfileExperience {
  id: string
  title: string
  company: string
  location?: string
  start_date: string
  end_date?: string
  is_current: boolean
  description?: string
}

export interface ProfileEducation {
  id: string
  degree: string
  field_of_study?: string
  school: string
  start_date?: string
  end_date?: string
  grade?: string
  description?: string
}

export interface ProfileCertification {
  id: string
  name: string
  issuing_organization: string
  issue_date?: string
  expiry_date?: string
  credential_id?: string
  credential_url?: string
}

export interface ProfileLanguage {
  language: string
  proficiency: string
}

export interface GetApplicationsParams {
  status?: ApplicationStatus
  search?: string
  page?: number
  limit?: number
  sort?: 'newest' | 'oldest' | 'rating'
}

export interface StatusCounts {
  submitted: number
  reviewed: number
  shortlisted: number
  interview: number
  offered: number
  hired: number
  rejected: number
  withdrawn: number
}

export interface ApplicationsResponse {
  applications: Application[]
  total: number
  page: number
  limit: number
  status_counts?: StatusCounts
}

export interface UpdateApplicationStatusData {
  status: ApplicationStatus
  reason?: string
}

export interface UpdateApplicationNotesData {
  notes: string
}

export interface RateApplicantData {
  rating: number
}

export interface ApplicationNote {
  id: string
  content: string
  author_name: string
  created_at: string
}

export const employerApplicationsApi = {
  async getJobApplications(
    jobId: string,
    params: GetApplicationsParams = {}
  ): Promise<ApplicationsResponse> {
    const response = await apiClient.get(`/employer/jobs/${jobId}/applications`, { params })
    // Backend returns { success, message, data: { applications, pagination } }
    const apiData = response.data.data || response.data
    return {
      applications: apiData.applications || [],
      total: apiData.pagination?.total || 0,
      page: apiData.pagination?.page || 1,
      limit: apiData.pagination?.limit || 10,
      status_counts: apiData.status_counts,
    }
  },

  async getAllApplications(params: GetApplicationsParams = {}): Promise<ApplicationsResponse> {
    const response = await apiClient.get('/employer/applications', { params })
    // Backend returns { success, message, data: { applications, pagination } }
    const apiData = response.data.data || response.data
    return {
      applications: apiData.applications || [],
      total: apiData.pagination?.total || 0,
      page: apiData.pagination?.page || 1,
      limit: apiData.pagination?.limit || 10,
      status_counts: apiData.status_counts,
    }
  },

  async getApplication(id: string): Promise<Application> {
    const response = await apiClient.get(`/employer/applications/${id}`)
    // Backend returns { success, message, data: { application } }
    const apiData = response.data.data || response.data
    return apiData.application
  },

  async updateApplicationStatus(
    id: string,
    data: UpdateApplicationStatusData
  ): Promise<Application> {
    const response = await apiClient.patch(`/employer/applications/${id}/status`, data)
    const apiData = response.data.data || response.data
    return apiData.application
  },

  async updateApplicationNotes(id: string, data: UpdateApplicationNotesData): Promise<Application> {
    const response = await apiClient.patch(`/employer/applications/${id}/notes`, data)
    const apiData = response.data.data || response.data
    return apiData.application
  },

  async rateApplicant(id: string, data: RateApplicantData): Promise<Application> {
    const response = await apiClient.patch(`/employer/applications/${id}/rating`, data)
    const apiData = response.data.data || response.data
    return apiData.application
  },

  async getApplicantProfile(applicationId: string): Promise<ApplicantProfile> {
    const response = await apiClient.get(`/employer/applications/${applicationId}/profile`)
    const apiData = response.data.data || response.data
    return apiData.profile
  },

  async downloadApplicantResume(applicationId: string): Promise<Blob> {
    const response = await apiClient.get(`/employer/applications/${applicationId}/resume`, {
      responseType: 'blob',
    })
    return response.data
  },

  async getApplicationNotes(applicationId: string): Promise<ApplicationNote[]> {
    const response = await apiClient.get(`/employer/applications/${applicationId}/notes`)
    const apiData = response.data.data || response.data
    return apiData.notes || []
  },

  async addApplicationNote(applicationId: string, note: string): Promise<ApplicationNote> {
    const response = await apiClient.post(`/employer/applications/${applicationId}/notes`, { note })
    const apiData = response.data.data || response.data
    return apiData.note
  },
}

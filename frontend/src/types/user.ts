export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  status: UserStatus
  email_verified: boolean
  avatar_url?: string
  created_at: string
}

export type UserRole = 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED'

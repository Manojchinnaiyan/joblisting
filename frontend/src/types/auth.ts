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

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'JOB_SEEKER' | 'EMPLOYER'
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

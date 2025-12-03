import { apiClient } from '../client'

export interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  role: string
  status: string
  is_2fa_enabled?: boolean
  two_factor_enabled?: boolean
  created_at: string
  last_login_at?: string
}

export interface AdminLoginResponse {
  requires_2fa: boolean
  temp_token?: string
  user?: AdminUser
  access_token?: string
  refresh_token?: string
}

export interface Admin2FASetupResponse {
  secret: string
  qr_code: string
}

export const adminAuthApi = {
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    const response = await apiClient.post('/admin/auth/login', { email, password })
    const data = response.data.data || response.data
    // Transform backend response to match frontend interface
    return {
      requires_2fa: data.two_factor_required || false,
      temp_token: data.challenge,
      user: data.user,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    }
  },

  async verify2FA(code: string, tempToken: string): Promise<{ user: AdminUser; access_token: string; refresh_token: string }> {
    const response = await apiClient.post('/admin/auth/verify-2fa', { code, temp_token: tempToken })
    return response.data.data || response.data
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/admin/auth/logout', { refresh_token: refreshToken })
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const response = await apiClient.post('/admin/auth/refresh', { refresh_token: refreshToken })
    return response.data.data || response.data
  },

  async getMe(): Promise<AdminUser> {
    const response = await apiClient.get('/admin/auth/me')
    return response.data.data || response.data.user || response.data
  },

  async enable2FA(): Promise<Admin2FASetupResponse> {
    const response = await apiClient.post('/admin/auth/enable-2fa')
    return response.data.data || response.data
  },

  async disable2FA(code: string): Promise<void> {
    await apiClient.post('/admin/auth/disable-2fa', { code })
  },

  async verifyEnable2FA(code: string): Promise<void> {
    await apiClient.post('/admin/auth/verify-enable-2fa', { code })
  },

  async updateProfile(data: Partial<AdminUser>): Promise<AdminUser> {
    const response = await apiClient.put('/admin/auth/profile', data)
    return response.data.data?.user || response.data.data || response.data.user || response.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/admin/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },
}

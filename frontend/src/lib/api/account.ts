import apiClient from './client'

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface SetPasswordRequest {
  new_password: string
  confirm_password: string
}

export interface DeleteAccountRequest {
  password: string
}

export const accountApi = {
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post('/auth/change-password', data)
  },

  // For OAuth users to set a password (they don't have one yet)
  setPassword: async (data: SetPasswordRequest): Promise<void> => {
    await apiClient.post('/auth/set-password', data)
  },

  deleteAccount: async (data: DeleteAccountRequest): Promise<void> => {
    await apiClient.delete('/auth/account', { data })
  },
}

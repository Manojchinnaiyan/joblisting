import apiClient from './client'

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface DeleteAccountRequest {
  password: string
}

export const accountApi = {
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.put('/auth/change-password', data)
  },

  deleteAccount: async (data: DeleteAccountRequest): Promise<void> => {
    await apiClient.delete('/auth/account', { data })
  },
}

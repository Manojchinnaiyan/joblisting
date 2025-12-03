import { apiClient } from '../client'

export interface AdminSetting {
  key: string
  value: string | number | boolean | object
  type: 'string' | 'number' | 'boolean' | 'json'
  category: string
  description?: string
  is_public: boolean
  updated_at: string
  updated_by?: string
}

export interface SettingsResponse {
  settings: AdminSetting[]
  total: number
}

export interface SettingsByCategory {
  [category: string]: AdminSetting[]
}

export const adminSettingsApi = {
  async getSettings(): Promise<SettingsResponse> {
    const response = await apiClient.get('/admin/settings')
    return response.data.data || response.data
  },

  async getSettingsByCategory(): Promise<SettingsByCategory> {
    const response = await apiClient.get('/admin/settings')
    const data = response.data.data || response.data
    const settings: AdminSetting[] = data.settings || data

    const grouped: SettingsByCategory = {}
    settings.forEach((setting: AdminSetting) => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = []
      }
      grouped[setting.category].push(setting)
    })
    return grouped
  },

  async getSetting(key: string): Promise<AdminSetting> {
    const response = await apiClient.get(`/admin/settings/${key}`)
    return response.data.data || response.data.setting || response.data
  },

  async updateSetting(key: string, value: string | number | boolean | object): Promise<AdminSetting> {
    const response = await apiClient.put(`/admin/settings/${key}`, { value })
    return response.data.data || response.data.setting || response.data
  },

  async deleteSetting(key: string): Promise<void> {
    await apiClient.delete(`/admin/settings/${key}`)
  },

  async createSetting(data: {
    key: string
    value: string | number | boolean | object
    type: 'string' | 'number' | 'boolean' | 'json'
    category: string
    description?: string
    is_public?: boolean
  }): Promise<AdminSetting> {
    const response = await apiClient.post('/admin/settings', data)
    return response.data.data || response.data.setting || response.data
  },
}

import { apiClient } from '../client'

export type TeamRole = 'owner' | 'admin' | 'recruiter' | 'member'

export interface TeamMember {
  id: string
  user_id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  role: TeamRole
  joined_at: string
  last_active_at?: string
}

export interface TeamInvitation {
  id: string
  email: string
  role: TeamRole
  invited_by: string
  invited_by_name: string
  sent_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
}

export interface InviteTeamMemberData {
  email: string
  role: Exclude<TeamRole, 'owner'>
  message?: string
}

export interface UpdateMemberRoleData {
  role: Exclude<TeamRole, 'owner'>
}

export interface TransferOwnershipData {
  new_owner_id: string
  password: string
}

export const employerTeamApi = {
  async getTeamMembers(): Promise<TeamMember[]> {
    const response = await apiClient.get('/employer/company/team')
    // Backend returns { success, message, data: { members } }
    const apiData = response.data.data || response.data
    return apiData.members ?? []
  },

  async inviteTeamMember(data: InviteTeamMemberData): Promise<TeamInvitation> {
    const response = await apiClient.post('/employer/company/invitations', data)
    const apiData = response.data.data || response.data
    return apiData.invitation
  },

  async removeTeamMember(id: string): Promise<void> {
    await apiClient.delete(`/employer/company/team/${id}`)
  },

  async updateMemberRole(id: string, data: UpdateMemberRoleData): Promise<TeamMember> {
    const response = await apiClient.put(`/employer/company/team/${id}/role`, data)
    const apiData = response.data.data || response.data
    return apiData.member
  },

  async transferOwnership(data: TransferOwnershipData): Promise<void> {
    await apiClient.post('/employer/company/team/transfer-ownership', data)
  },

  async getPendingInvitations(): Promise<TeamInvitation[]> {
    const response = await apiClient.get('/employer/company/invitations')
    // Backend returns { success, message, data: { invitations } }
    const apiData = response.data.data || response.data
    return apiData.invitations ?? []
  },

  async cancelInvitation(id: string): Promise<void> {
    await apiClient.delete(`/employer/company/invitations/${id}`)
  },

  async resendInvitation(id: string): Promise<TeamInvitation> {
    const response = await apiClient.post(`/employer/company/invitations/${id}/resend`)
    const apiData = response.data.data || response.data
    return apiData.invitation
  },
}

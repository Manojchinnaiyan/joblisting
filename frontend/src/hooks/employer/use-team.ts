'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  employerTeamApi,
  TeamMember,
  TeamInvitation,
  InviteTeamMemberData,
  UpdateMemberRoleData,
  TransferOwnershipData,
} from '@/lib/api/employer/team'

export const teamKeys = {
  all: ['employer', 'team'] as const,
  members: () => [...teamKeys.all, 'members'] as const,
  invitations: () => [...teamKeys.all, 'invitations'] as const,
}

export function useTeamMembers() {
  return useQuery({
    queryKey: teamKeys.members(),
    queryFn: () => employerTeamApi.getTeamMembers(),
  })
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteTeamMemberData) => employerTeamApi.inviteTeamMember(data),
    onSuccess: (invitation) => {
      queryClient.setQueryData(teamKeys.invitations(), (old: TeamInvitation[] | undefined) => {
        return old ? [...old, invitation] : [invitation]
      })
      toast.success('Invitation sent successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send invitation')
    },
  })
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerTeamApi.removeTeamMember(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(teamKeys.members(), (old: TeamMember[] | undefined) => {
        return old ? old.filter((m) => m.id !== id) : []
      })
      toast.success('Team member removed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove team member')
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberRoleData }) =>
      employerTeamApi.updateMemberRole(id, data),
    onSuccess: (member) => {
      queryClient.setQueryData(teamKeys.members(), (old: TeamMember[] | undefined) => {
        return old ? old.map((m) => (m.id === member.id ? member : m)) : []
      })
      toast.success('Role updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role')
    },
  })
}

export function useTransferOwnership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TransferOwnershipData) => employerTeamApi.transferOwnership(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members() })
      toast.success('Ownership transferred successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to transfer ownership')
    },
  })
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: teamKeys.invitations(),
    queryFn: () => employerTeamApi.getPendingInvitations(),
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerTeamApi.cancelInvitation(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(teamKeys.invitations(), (old: TeamInvitation[] | undefined) => {
        return old ? old.filter((i) => i.id !== id) : []
      })
      toast.success('Invitation cancelled successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel invitation')
    },
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerTeamApi.resendInvitation(id),
    onSuccess: (invitation) => {
      queryClient.setQueryData(teamKeys.invitations(), (old: TeamInvitation[] | undefined) => {
        return old ? old.map((i) => (i.id === invitation.id ? invitation : i)) : []
      })
      toast.success('Invitation resent successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resend invitation')
    },
  })
}

// Alias for useUpdateMemberRole
export const useUpdateTeamMemberRole = useUpdateMemberRole

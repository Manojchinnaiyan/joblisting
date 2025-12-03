import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { skillsApi } from '@/lib/api/skills'
import { CreateSkillRequest, UpdateSkillRequest, BulkUpdateSkillsRequest } from '@/types/skill'
import { toast } from 'sonner'

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.getSkills,
  })
}

export function useAddSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSkillRequest) => skillsApi.addSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Skill added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add skill')
    },
  })
}

export function useUpdateSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSkillRequest }) =>
      skillsApi.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      toast.success('Skill updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update skill')
    },
  })
}

export function useDeleteSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => skillsApi.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Skill deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete skill')
    },
  })
}

export function useBulkUpdateSkills() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkUpdateSkillsRequest) => skillsApi.bulkUpdateSkills(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Skills updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update skills')
    },
  })
}

// Export alias for consistency with component imports
export { useAddSkill as useCreateSkill }

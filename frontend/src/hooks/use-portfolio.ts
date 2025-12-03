import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { portfolioApi } from '@/lib/api/portfolio'
import { CreateProjectRequest, UpdateProjectRequest } from '@/types/portfolio'
import { toast } from 'sonner'

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: portfolioApi.getPortfolio,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => portfolioApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Project added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add project')
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      portfolioApi.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      toast.success('Project updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update project')
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => portfolioApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Project deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete project')
    },
  })
}

export function useSetFeatured() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      portfolioApi.setFeatured(id, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      toast.success('Featured status updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update featured status')
    },
  })
}

// Export aliases for consistency with component imports
export { useCreateProject as useCreatePortfolioProject }
export { useUpdateProject as useUpdatePortfolioProject }
export { useDeleteProject as useDeletePortfolioProject }

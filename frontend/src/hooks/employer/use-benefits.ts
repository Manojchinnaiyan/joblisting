'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  employerBenefitsApi,
  CompanyBenefit,
  CreateBenefitData,
  UpdateBenefitData,
  ReorderBenefitsData,
} from '@/lib/api/employer/benefits'

export const benefitsKeys = {
  all: ['employer', 'benefits'] as const,
  list: () => [...benefitsKeys.all, 'list'] as const,
}

export function useCompanyBenefits() {
  return useQuery({
    queryKey: benefitsKeys.list(),
    queryFn: () => employerBenefitsApi.getBenefits(),
  })
}

export function useCreateBenefit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBenefitData) => employerBenefitsApi.createBenefit(data),
    onSuccess: (benefit) => {
      queryClient.setQueryData(benefitsKeys.list(), (old: CompanyBenefit[] | undefined) => {
        return old ? [...old, benefit] : [benefit]
      })
      toast.success('Benefit added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add benefit')
    },
  })
}

export function useUpdateBenefit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBenefitData }) =>
      employerBenefitsApi.updateBenefit(id, data),
    onSuccess: (benefit) => {
      queryClient.setQueryData(benefitsKeys.list(), (old: CompanyBenefit[] | undefined) => {
        return old ? old.map((b) => (b.id === benefit.id ? benefit : b)) : [benefit]
      })
      toast.success('Benefit updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update benefit')
    },
  })
}

export function useDeleteBenefit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerBenefitsApi.deleteBenefit(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(benefitsKeys.list(), (old: CompanyBenefit[] | undefined) => {
        return old ? old.filter((b) => b.id !== id) : []
      })
      toast.success('Benefit deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete benefit')
    },
  })
}

export function useReorderBenefits() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReorderBenefitsData) => employerBenefitsApi.reorderBenefits(data),
    onSuccess: (benefits) => {
      queryClient.setQueryData(benefitsKeys.list(), benefits)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reorder benefits')
    },
  })
}

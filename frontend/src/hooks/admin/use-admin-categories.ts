'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminCategoriesApi,
  CreateCategoryData,
  UpdateCategoryData,
  ReorderCategoriesData,
} from '@/lib/api/admin/categories'

interface CategoriesParams {
  tree?: boolean
  limit?: number
  page?: number
}

export const adminCategoriesKeys = {
  all: ['admin', 'categories'] as const,
  lists: () => [...adminCategoriesKeys.all, 'list'] as const,
  list: (params?: CategoriesParams) =>
    [...adminCategoriesKeys.lists(), params] as const,
  details: () => [...adminCategoriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminCategoriesKeys.details(), id] as const,
}

export function useAdminCategories(params?: CategoriesParams) {
  return useQuery({
    queryKey: adminCategoriesKeys.list(params),
    queryFn: () => adminCategoriesApi.getCategories(params),
  })
}

export function useAdminCategory(id: string) {
  return useQuery({
    queryKey: adminCategoriesKeys.detail(id),
    queryFn: () => adminCategoriesApi.getCategory(id),
    enabled: !!id,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryData) => adminCategoriesApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesKeys.lists() })
      toast.success('Category created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create category')
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) =>
      adminCategoriesApi.updateCategory(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCategoriesKeys.detail(id) })
      toast.success('Category updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update category')
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminCategoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesKeys.lists() })
      toast.success('Category deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete category')
    },
  })
}

export function useReorderCategories() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReorderCategoriesData) =>
      adminCategoriesApi.reorderCategories(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesKeys.lists() })
      toast.success('Categories reordered successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reorder categories')
    },
  })
}

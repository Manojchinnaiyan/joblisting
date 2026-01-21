'use client'

import { useQuery } from '@tanstack/react-query'
import {
  adminSkillsApi,
  SkillsUsersFilters,
  SkillsUsersPagination,
} from '@/lib/api/admin/skills'

export const adminSkillsKeys = {
  all: ['admin', 'skills'] as const,
  topSkills: (limit: number) => [...adminSkillsKeys.all, 'top', limit] as const,
  search: (query: string, limit: number) => [...adminSkillsKeys.all, 'search', query, limit] as const,
  users: () => [...adminSkillsKeys.all, 'users'] as const,
  usersList: (filters: SkillsUsersFilters, pagination: SkillsUsersPagination) =>
    [...adminSkillsKeys.users(), { filters, pagination }] as const,
}

export function useAdminTopSkills(limit: number = 50) {
  return useQuery({
    queryKey: adminSkillsKeys.topSkills(limit),
    queryFn: () => adminSkillsApi.getTopSkills(limit),
  })
}

export function useAdminSearchSkills(query: string, limit: number = 20) {
  return useQuery({
    queryKey: adminSkillsKeys.search(query, limit),
    queryFn: () => adminSkillsApi.searchSkills(query, limit),
    enabled: query.length >= 2,
  })
}

export function useAdminUsersBySkills(
  filters: SkillsUsersFilters = {},
  pagination: SkillsUsersPagination = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: adminSkillsKeys.usersList(filters, pagination),
    queryFn: () => adminSkillsApi.getUsersBySkills(filters, pagination),
  })
}

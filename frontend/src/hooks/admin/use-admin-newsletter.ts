'use client'

import { useQuery } from '@tanstack/react-query'
import {
  adminNewsletterApi,
  NewsletterPagination,
} from '@/lib/api/admin/newsletter'

export const adminNewsletterKeys = {
  all: ['admin', 'newsletter'] as const,
  lists: () => [...adminNewsletterKeys.all, 'list'] as const,
  list: (pagination: NewsletterPagination) =>
    [...adminNewsletterKeys.lists(), { pagination }] as const,
}

export function useAdminNewsletterSubscribers(
  pagination: NewsletterPagination = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: adminNewsletterKeys.list(pagination),
    queryFn: () => adminNewsletterApi.getSubscribers(pagination),
  })
}

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  employerLocationsApi,
  CompanyLocation,
  CreateLocationData,
  UpdateLocationData,
} from '@/lib/api/employer/locations'

export const locationsKeys = {
  all: ['employer', 'locations'] as const,
  list: () => [...locationsKeys.all, 'list'] as const,
}

export function useCompanyLocations() {
  return useQuery({
    queryKey: locationsKeys.list(),
    queryFn: () => employerLocationsApi.getLocations(),
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLocationData) => employerLocationsApi.createLocation(data),
    onSuccess: (location) => {
      queryClient.setQueryData(locationsKeys.list(), (old: CompanyLocation[] | undefined) => {
        // If new location is headquarters, unset other headquarters
        if (location.is_headquarters && old) {
          const updated = old.map((l) => ({ ...l, is_headquarters: false }))
          return [...updated, location]
        }
        return old ? [...old, location] : [location]
      })
      toast.success('Location added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add location')
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLocationData }) =>
      employerLocationsApi.updateLocation(id, data),
    onSuccess: (location) => {
      queryClient.setQueryData(locationsKeys.list(), (old: CompanyLocation[] | undefined) => {
        if (!old) return [location]
        // If updated location is now headquarters, unset others
        if (location.is_headquarters) {
          return old.map((l) =>
            l.id === location.id ? location : { ...l, is_headquarters: false }
          )
        }
        return old.map((l) => (l.id === location.id ? location : l))
      })
      toast.success('Location updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update location')
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerLocationsApi.deleteLocation(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(locationsKeys.list(), (old: CompanyLocation[] | undefined) => {
        return old ? old.filter((l) => l.id !== id) : []
      })
      toast.success('Location deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete location')
    },
  })
}

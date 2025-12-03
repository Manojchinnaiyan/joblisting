'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  employerCandidatesApi,
  SearchCandidatesParams,
  SaveCandidateData,
  UpdateSavedCandidateData,
  SavedCandidate,
} from '@/lib/api/employer/candidates'

export const candidatesKeys = {
  all: ['employer', 'candidates'] as const,
  search: (params: SearchCandidatesParams) => [...candidatesKeys.all, 'search', params] as const,
  profile: (id: string) => [...candidatesKeys.all, 'profile', id] as const,
  saved: (params: { page?: number; limit?: number }) =>
    [...candidatesKeys.all, 'saved', params] as const,
}

export function useSearchCandidates(params: SearchCandidatesParams = {}) {
  return useQuery({
    queryKey: candidatesKeys.search(params),
    queryFn: () => employerCandidatesApi.searchCandidates(params),
  })
}

export function useCandidateProfile(id: string) {
  return useQuery({
    queryKey: candidatesKeys.profile(id),
    queryFn: () => employerCandidatesApi.getCandidateProfile(id),
    enabled: !!id,
  })
}

export function useSavedCandidates(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: candidatesKeys.saved(params),
    queryFn: () => employerCandidatesApi.getSavedCandidates(params),
  })
}

export function useSaveCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaveCandidateData) => employerCandidatesApi.saveCandidate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...candidatesKeys.all, 'saved'] })
      toast.success('Candidate saved successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save candidate')
    },
  })
}

export function useRemoveSavedCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerCandidatesApi.removeSavedCandidate(id),
    onSuccess: (_, id) => {
      queryClient.setQueriesData(
        { queryKey: [...candidatesKeys.all, 'saved'] },
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            candidates: old.candidates.filter((c: SavedCandidate) => c.id !== id),
            total: old.total - 1,
          }
        }
      )
      toast.success('Candidate removed from saved list')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove candidate')
    },
  })
}

export function useUpdateCandidateNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSavedCandidateData }) =>
      employerCandidatesApi.updateSavedCandidateNotes(id, data),
    onSuccess: (updated) => {
      queryClient.setQueriesData(
        { queryKey: [...candidatesKeys.all, 'saved'] },
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            candidates: old.candidates.map((c: SavedCandidate) =>
              c.id === updated.id ? updated : c
            ),
          }
        }
      )
      toast.success('Notes updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update notes')
    },
  })
}

// Alias for useRemoveSavedCandidate
export const useUnsaveCandidate = useRemoveSavedCandidate

// Alias for useCandidateProfile
export const useCandidate = useCandidateProfile

export function useCandidateNotes(candidateId: string) {
  return useQuery({
    queryKey: [...candidatesKeys.all, 'notes', candidateId] as const,
    queryFn: () => employerCandidatesApi.getCandidateNotes(candidateId),
    enabled: !!candidateId,
  })
}

export function useAddCandidateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ candidateId, note }: { candidateId: string; note: string }) =>
      employerCandidatesApi.addCandidateNote(candidateId, note),
    onSuccess: (_, { candidateId }) => {
      queryClient.invalidateQueries({ queryKey: [...candidatesKeys.all, 'notes', candidateId] })
      toast.success('Note added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add note')
    },
  })
}

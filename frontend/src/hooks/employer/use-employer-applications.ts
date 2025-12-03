'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  employerApplicationsApi,
  Application,
  GetApplicationsParams,
  UpdateApplicationStatusData,
  UpdateApplicationNotesData,
  RateApplicantData,
} from '@/lib/api/employer/applications'
import { useAuthStore } from '@/store/auth-store'

export const applicationsKeys = {
  all: ['employer', 'applications'] as const,
  job: (jobId: string, params: GetApplicationsParams) =>
    [...applicationsKeys.all, 'job', jobId, params] as const,
  list: (params: GetApplicationsParams) => [...applicationsKeys.all, 'list', params] as const,
  detail: (id: string) => [...applicationsKeys.all, 'detail', id] as const,
  profile: (id: string) => [...applicationsKeys.all, 'profile', id] as const,
}

export function useJobApplications(jobId: string, params: GetApplicationsParams = {}) {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true && !!jobId

  return useQuery({
    queryKey: applicationsKeys.job(jobId, params),
    queryFn: () => employerApplicationsApi.getJobApplications(jobId, params),
    enabled: isEnabled,
    retry: false,
  })
}

export function useAllApplications(params: GetApplicationsParams = {}) {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true

  return useQuery({
    queryKey: applicationsKeys.list(params),
    queryFn: () => employerApplicationsApi.getAllApplications(params),
    enabled: isEnabled,
    retry: false,
  })
}

export function useApplication(id: string) {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true && !!id

  return useQuery({
    queryKey: applicationsKeys.detail(id),
    queryFn: () => employerApplicationsApi.getApplication(id),
    enabled: isEnabled,
    retry: false,
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApplicationStatusData }) =>
      employerApplicationsApi.updateApplicationStatus(id, data),
    onSuccess: (application) => {
      queryClient.setQueryData(applicationsKeys.detail(application.id), application)
      queryClient.invalidateQueries({ queryKey: applicationsKeys.all })
      toast.success('Application status updated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status')
    },
  })
}

export function useUpdateApplicationNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApplicationNotesData }) =>
      employerApplicationsApi.updateApplicationNotes(id, data),
    onSuccess: (application) => {
      queryClient.setQueryData(applicationsKeys.detail(application.id), application)
      toast.success('Notes saved')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save notes')
    },
  })
}

export function useRateApplicant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RateApplicantData }) =>
      employerApplicationsApi.rateApplicant(id, data),
    onSuccess: (application) => {
      queryClient.setQueryData(applicationsKeys.detail(application.id), application)
      queryClient.invalidateQueries({ queryKey: applicationsKeys.all })
      toast.success('Rating saved')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save rating')
    },
  })
}

export function useApplicantProfile(applicationId: string) {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true && !!applicationId

  return useQuery({
    queryKey: applicationsKeys.profile(applicationId),
    queryFn: () => employerApplicationsApi.getApplicantProfile(applicationId),
    enabled: isEnabled,
    retry: false,
  })
}

export function useDownloadResume() {
  return useMutation({
    mutationFn: (applicationId: string) =>
      employerApplicationsApi.downloadApplicantResume(applicationId),
    onSuccess: (blob, applicationId) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `resume-${applicationId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to download resume')
    },
  })
}

export function useApplicationNotes(applicationId: string) {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true && !!applicationId

  return useQuery({
    queryKey: [...applicationsKeys.all, 'notes', applicationId] as const,
    queryFn: () => employerApplicationsApi.getApplicationNotes(applicationId),
    enabled: isEnabled,
    retry: false,
  })
}

export function useAddApplicationNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, note }: { applicationId: string; note: string }) =>
      employerApplicationsApi.addApplicationNote(applicationId, note),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: [...applicationsKeys.all, 'notes', applicationId] })
      toast.success('Note added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add note')
    },
  })
}

// Alias for useRateApplicant
export const useRateApplication = useRateApplicant

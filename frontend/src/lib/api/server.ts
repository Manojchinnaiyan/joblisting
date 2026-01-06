// Server-side API client for SSR data fetching
// This file should only be imported in server components

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// Server-side fetch wrapper with error handling
async function serverFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Cache for 5 minutes, revalidate in background
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`)
      return null
    }

    const data: ApiResponse<T> = await response.json()
    return data.data ?? null
  } catch (error) {
    console.error('Server fetch error:', error)
    return null
  }
}

// Server-side API functions for homepage data
export const serverApi = {
  getFeaturedJobs: async (limit: number = 6) => {
    const data = await serverFetch<{ jobs: any[] }>(`/jobs/featured?limit=${limit}`)
    return data?.jobs ?? []
  },

  getCategories: async () => {
    const data = await serverFetch<{ categories: { id: string; name: string; slug: string; count: number }[] }>(
      '/jobs/categories'
    )
    return data?.categories ?? []
  },

  getFeaturedCompanies: async (limit: number = 6) => {
    const data = await serverFetch<{ companies: any[] }>(`/companies/featured?limit=${limit}`)
    return data?.companies ?? []
  },

  getJobStats: async () => {
    const data = await serverFetch<{ total_jobs: number; total_companies: number }>('/jobs/stats')
    return data
  },
}

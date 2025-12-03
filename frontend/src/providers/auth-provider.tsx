'use client'

import { useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { authApi } from '@/lib/api/auth'

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading, logout, accessToken, _hasHydrated } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      if (accessToken) {
        try {
          const user = await authApi.getMe()
          setUser(user)
        } catch (error) {
          logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [accessToken, setUser, setLoading, logout])

  // Show loading screen until zustand store has hydrated from localStorage
  if (!_hasHydrated) {
    return <LoadingScreen />
  }

  return <>{children}</>
}

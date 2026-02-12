'use client'

import { useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { authApi } from '@/lib/api/auth'
import { identifyUser, resetUser } from '@/lib/posthog'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading, logout, accessToken, setHasHydrated } = useAuthStore()

  // Force hydration on mount and validate auth
  useEffect(() => {
    const initAuth = async () => {
      // Mark as hydrated immediately on client
      setHasHydrated(true)

      if (accessToken) {
        try {
          const user = await authApi.getMe()
          setUser(user)

          // Identify user in PostHog
          if (user?.id) {
            identifyUser(user.id.toString(), {
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              full_name: `${user.first_name} ${user.last_name}`,
              role: user.role,
              email_verified: user.email_verified,
            })
          }
        } catch {
          // Token is invalid - clear auth state
          logout()
          resetUser() // Clear PostHog user data
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [accessToken, setUser, setLoading, logout, setHasHydrated])

  // Always render children - don't block on auth
  return <>{children}</>
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { ROUTES } from '@/lib/constants'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: ('JOB_SEEKER' | 'EMPLOYER' | 'ADMIN')[]
}

export function AuthGuard({ children, requireAuth = true, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (requireAuth && !isAuthenticated) {
      router.push(ROUTES.LOGIN)
      return
    }

    if (!requireAuth && isAuthenticated) {
      router.push(ROUTES.DASHBOARD)
      return
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push(ROUTES.DASHBOARD)
    }
  }, [isAuthenticated, isLoading, user, requireAuth, allowedRoles, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (!requireAuth && isAuthenticated) {
    return null
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

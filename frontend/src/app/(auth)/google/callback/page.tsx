'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useAuthStore } from '@/store/auth-store'
import { useAdminAuthStore } from '@/store/admin-auth-store'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'
import { User, UserRole } from '@/types/auth'

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuthStore()
  const { setTokens: setAdminTokens, setUser: setAdminUser } = useAdminAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      const message = searchParams.get('message')

      if (error) {
        const errorMsg = errorDescription || message || 'Google authentication failed'
        toast.error(errorMsg)
        router.push(ROUTES.LOGIN)
        return
      }

      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const userId = searchParams.get('user_id')
      const email = searchParams.get('email')
      const firstName = searchParams.get('first_name')
      const lastName = searchParams.get('last_name')
      const role = searchParams.get('role') as UserRole

      if (!accessToken || !refreshToken) {
        toast.error('Invalid authentication response')
        router.push(ROUTES.LOGIN)
        return
      }

      // Create user object from URL params
      const user: User = {
        id: userId || '',
        email: email || '',
        first_name: firstName || '',
        last_name: lastName || '',
        role: role || 'JOB_SEEKER',
        status: 'ACTIVE',
        email_verified: true, // Google users are always verified
        created_at: new Date().toISOString(),
      }

      // Store auth data
      login(user, {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 86400, // 24 hours
      })

      toast.success('Logged in successfully with Google!')

      // Handle admin users
      if (role === 'ADMIN') {
        setAdminTokens(accessToken, refreshToken)
        setAdminUser({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          status: user.status || 'ACTIVE',
          created_at: user.created_at || new Date().toISOString(),
        })
        window.location.href = ROUTES.ADMIN
        return
      }

      // Redirect based on role
      if (role === 'EMPLOYER') {
        // Redirect to company setup - the employer layout will check if company exists
        // and redirect to employer dashboard if company already exists
        router.push('/company/setup')
      } else {
        router.push(ROUTES.DASHBOARD)
      }
    }

    handleCallback()
  }, [searchParams, router, login, setAdminTokens, setAdminUser])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authenticating...</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <LoadingSpinner size={40} />
          <p className="text-sm text-muted-foreground">
            Completing sign in with Google...
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner size={40} />
          </div>
        </CardContent>
      </Card>
    }>
      <GoogleCallbackContent />
    </Suspense>
  )
}

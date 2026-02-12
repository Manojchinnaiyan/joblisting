'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { GoogleButton } from './google-button'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { useAdminAuthStore } from '@/store/admin-auth-store'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import { trackSignIn } from '@/lib/posthog'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuthStore()
  const { setTokens: setAdminTokens, setUser: setAdminUser } = useAdminAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(data)

      // Track successful login
      trackSignIn('email')

      // For admin users, store auth data directly and use hard navigation
      // to avoid RSC fetch race conditions in Safari
      if (response.user.role === 'ADMIN') {
        // Store auth data in localStorage before React state update
        const authData = {
          state: {
            user: response.user,
            accessToken: response.tokens.access_token,
            refreshToken: response.tokens.refresh_token,
            isAuthenticated: true,
          },
          version: 0,
        }
        localStorage.setItem('auth-storage', JSON.stringify(authData))

        // Store admin auth data
        const adminAuthData = {
          state: {
            user: {
              id: response.user.id,
              email: response.user.email,
              first_name: response.user.first_name,
              last_name: response.user.last_name,
              role: response.user.role,
              status: response.user.status || 'active',
              created_at: response.user.created_at || new Date().toISOString(),
            },
            accessToken: response.tokens.access_token,
            refreshToken: response.tokens.refresh_token,
            isAuthenticated: true,
          },
          version: 0,
        }
        localStorage.setItem('admin-auth-storage', JSON.stringify(adminAuthData))

        toast.success('Logged in successfully')
        // Hard navigation immediately - don't update React state
        window.location.href = ROUTES.ADMIN
        return
      }

      // For non-admin users, use normal flow
      login(response.user, response.tokens)
      toast.success('Logged in successfully')

      // Check for post-login redirect (e.g., from resume template selection)
      const postLoginRedirect = localStorage.getItem('post-login-redirect')
      if (postLoginRedirect && response.user.role === 'JOB_SEEKER') {
        localStorage.removeItem('post-login-redirect')
        router.push(postLoginRedirect)
        return
      }

      // Redirect based on user role
      if (response.user.role === 'EMPLOYER') {
        router.push(ROUTES.EMPLOYER)
      } else {
        router.push(ROUTES.DASHBOARD)
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <GoogleButton />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Don&apos;t have an account?{' '}
          <Link href={ROUTES.REGISTER} className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
        <p>
          Didn&apos;t receive verification email?{' '}
          <Link href={ROUTES.VERIFY_EMAIL} className="text-primary hover:underline">
            Resend it
          </Link>
        </p>
      </div>
    </div>
  )
}

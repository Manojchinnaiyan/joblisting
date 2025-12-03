'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { ROUTES } from '@/lib/constants'
import { CheckCircle, XCircle, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const { user } = useAuthStore()

  // Pre-fill email from logged in user
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email)
    }
  }, [user, email])

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        // No token - show resend form
        setStatus('resend')
        setMessage(user?.email
          ? 'Your email needs to be verified before you can continue. Click the button below to receive a verification link.'
          : 'Enter your email to receive a new verification link')
        return
      }

      try {
        await authApi.verifyEmail(token)
        setStatus('success')
        setMessage('Your email has been verified successfully!')
      } catch (error) {
        setStatus('error')
        setMessage('Failed to verify email. The link may have expired.')
      }
    }

    verifyEmail()
  }, [token, user?.email])

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setIsResending(true)
    try {
      await authApi.resendVerification(email)
      toast.success('Verification email sent! Please check your inbox.')
      setStatus('success')
      setMessage('Verification email sent! Please check your inbox and click the link to verify your account.')
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 'Failed to send verification email. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        {status === 'resend' && (
          <CardDescription>
            Request a new verification email
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          {status === 'loading' && (
            <div className="space-y-4">
              <LoadingSpinner size={40} />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-lg font-medium">{message}</p>
              <Button onClick={() => router.push(ROUTES.LOGIN)}>
                Continue to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <p className="text-lg font-medium">{message}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => setStatus('resend')}>
                  Resend Verification Email
                </Button>
                <Button onClick={() => router.push(ROUTES.HOME)}>
                  Go Home
                </Button>
              </div>
            </div>
          )}

          {status === 'resend' && (
            <div className="space-y-4 text-left">
              <div className="flex justify-center mb-4">
                <Mail className="h-16 w-16 text-muted-foreground" />
              </div>
              <p className="text-center text-muted-foreground mb-4">
                {message}
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isResending}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? 'Sending...' : 'Send Verification Email'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already verified?{' '}
                <button
                  onClick={() => router.push(ROUTES.LOGIN)}
                  className="text-primary hover:underline"
                >
                  Log in
                </button>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

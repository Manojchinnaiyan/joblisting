'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api/auth'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await authApi.forgotPassword(data)
      setEmailSent(true)
      toast.success('Password reset link sent to your email')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent you a password reset link. Please check your email and follow the instructions.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href={ROUTES.LOGIN}>Back to login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold">Forgot your password?</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}

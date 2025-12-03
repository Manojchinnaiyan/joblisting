'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangePassword } from '@/hooks/use-account'

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const changePassword = useChangePassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword.mutateAsync({
        current_password: data.current_password,
        new_password: data.new_password,
      })
      reset()
      router.push('/settings')
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/settings">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Change Password</h1>
        <p className="text-muted-foreground mt-1">
          Update your account password
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Password Settings</CardTitle>
          <CardDescription>
            Choose a strong password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current_password">
                Current Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="current_password"
                type="password"
                placeholder="Enter your current password"
                {...register('current_password')}
              />
              {errors.current_password && (
                <p className="text-sm text-red-500">{errors.current_password.message}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new_password">
                New Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Enter your new password"
                {...register('new_password')}
              />
              {errors.new_password && (
                <p className="text-sm text-red-500">{errors.new_password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm_password">
                Confirm New Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Confirm your new password"
                {...register('confirm_password')}
              />
              {errors.confirm_password && (
                <p className="text-sm text-red-500">{errors.confirm_password.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/settings')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

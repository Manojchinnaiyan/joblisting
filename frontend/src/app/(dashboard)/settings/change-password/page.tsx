'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Info } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useChangePassword, useSetPassword } from '@/hooks/use-account'
import { useAuthStore } from '@/store/auth-store'

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

const setPasswordSchema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
type SetPasswordFormData = z.infer<typeof setPasswordSchema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const changePassword = useChangePassword()
  const setPassword = useSetPassword()
  const user = useAuthStore((state) => state.user)

  const isGoogleUser = user?.auth_provider === 'GOOGLE'

  const changeForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const setForm = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
  })

  const onChangePassword = async (data: ChangePasswordFormData) => {
    try {
      await changePassword.mutateAsync({
        current_password: data.current_password,
        new_password: data.new_password,
      })
      changeForm.reset()
      router.push('/settings')
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onSetPassword = async (data: SetPasswordFormData) => {
    try {
      await setPassword.mutateAsync({
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      })
      setForm.reset()
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
        <h1 className="text-3xl font-bold">
          {isGoogleUser ? 'Set Password' : 'Change Password'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isGoogleUser
            ? 'Set a password to enable email login for your account'
            : 'Update your account password'
          }
        </p>
      </div>

      {/* Google User Alert */}
      {isGoogleUser && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You signed up with Google. Setting a password will allow you to also log in with your email and password in addition to Google Sign-In.
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Password Settings</CardTitle>
          <CardDescription>
            {isGoogleUser
              ? 'Create a password for your account'
              : 'Choose a strong password to keep your account secure'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGoogleUser ? (
            // Set Password Form for Google Users
            <form onSubmit={setForm.handleSubmit(onSetPassword)} className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new_password">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Enter your new password"
                  {...setForm.register('new_password')}
                />
                {setForm.formState.errors.new_password && (
                  <p className="text-sm text-red-500">{setForm.formState.errors.new_password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Confirm your new password"
                  {...setForm.register('confirm_password')}
                />
                {setForm.formState.errors.confirm_password && (
                  <p className="text-sm text-red-500">{setForm.formState.errors.confirm_password.message}</p>
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
                <Button type="submit" disabled={setPassword.isPending}>
                  {setPassword.isPending ? 'Setting...' : 'Set Password'}
                </Button>
              </div>
            </form>
          ) : (
            // Change Password Form for Email Users
            <form onSubmit={changeForm.handleSubmit(onChangePassword)} className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current_password">
                  Current Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="current_password"
                  type="password"
                  placeholder="Enter your current password"
                  {...changeForm.register('current_password')}
                />
                {changeForm.formState.errors.current_password && (
                  <p className="text-sm text-red-500">{changeForm.formState.errors.current_password.message}</p>
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
                  {...changeForm.register('new_password')}
                />
                {changeForm.formState.errors.new_password && (
                  <p className="text-sm text-red-500">{changeForm.formState.errors.new_password.message}</p>
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
                  {...changeForm.register('confirm_password')}
                />
                {changeForm.formState.errors.confirm_password && (
                  <p className="text-sm text-red-500">{changeForm.formState.errors.confirm_password.message}</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

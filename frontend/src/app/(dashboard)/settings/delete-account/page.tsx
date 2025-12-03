'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useDeleteAccount } from '@/hooks/use-account'
import { useAuthStore } from '@/store/auth-store'

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'You must type DELETE to confirm' }),
  }),
})

type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>

export default function DeleteAccountPage() {
  const router = useRouter()
  const deleteAccount = useDeleteAccount()
  const { logout } = useAuthStore()
  const [understood, setUnderstood] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
  })

  const onSubmit = async (data: DeleteAccountFormData) => {
    try {
      await deleteAccount.mutateAsync({ password: data.password })
      logout()
      router.push('/')
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
        <h1 className="text-3xl font-bold text-red-600">Delete Account</h1>
        <p className="text-muted-foreground mt-1">
          Permanently delete your account and all associated data
        </p>
      </div>

      {/* Warning */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-red-900">
                This action cannot be undone!
              </p>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>Your profile and all personal information will be deleted</li>
                <li>All your job applications will be withdrawn</li>
                <li>Your saved jobs and followed companies will be removed</li>
                <li>Your work experience, education, and skills will be deleted</li>
                <li>All uploaded resumes will be permanently removed</li>
                <li>You will not be able to recover your account</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Confirm Account Deletion</CardTitle>
          <CardDescription>
            Please confirm that you want to delete your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Understanding Checkbox */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="understood"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked === true)}
              />
              <Label
                htmlFor="understood"
                className="text-sm font-normal cursor-pointer"
              >
                I understand that this action is permanent and cannot be undone
              </Label>
            </div>

            {/* Password Confirmation */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                disabled={!understood}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Type DELETE Confirmation */}
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type <span className="font-mono font-bold">DELETE</span> to confirm{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmation"
                placeholder="DELETE"
                disabled={!understood}
                {...register('confirmation')}
              />
              {errors.confirmation && (
                <p className="text-sm text-red-500">{errors.confirmation.message}</p>
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
              <Button
                type="submit"
                variant="destructive"
                disabled={!understood || deleteAccount.isPending}
              >
                {deleteAccount.isPending ? 'Deleting...' : 'Delete My Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

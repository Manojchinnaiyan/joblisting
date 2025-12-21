'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { GoogleButton } from './google-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { authApi } from '@/lib/api/auth'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { ROUTES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'

export function RegisterForm() {
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')
  const initialRole = roleParam === 'employer' ? 'EMPLOYER' : 'JOB_SEEKER'

  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'JOB_SEEKER' | 'EMPLOYER'>(initialRole)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRole,
    },
  })

  useEffect(() => {
    setValue('role', initialRole)
  }, [initialRole, setValue])

  const handleRoleChange = (value: 'JOB_SEEKER' | 'EMPLOYER') => {
    setSelectedRole(value)
    setValue('role', value)
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await authApi.register(data)
      toast.success('Account created successfully. Please check your email to verify your account.')
      router.push(ROUTES.LOGIN)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Role Selection First */}
      <div className="space-y-2">
        <Label>I want to</Label>
        <Select
          onValueChange={(value) => handleRoleChange(value as 'JOB_SEEKER' | 'EMPLOYER')}
          value={selectedRole}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="JOB_SEEKER">Find a job</SelectItem>
            <SelectItem value="EMPLOYER">Hire talent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Google Sign Up */}
      <GoogleButton role={selectedRole} text="Sign up with Google" />

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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              placeholder="John"
              {...register('first_name')}
              disabled={isLoading}
            />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              placeholder="Doe"
              {...register('last_name')}
              disabled={isLoading}
            />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name.message}</p>
            )}
          </div>
        </div>

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
          <Label htmlFor="password">Password</Label>
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

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm Password</Label>
          <Input
            id="confirm_password"
            type="password"
            placeholder="••••••••"
            {...register('confirm_password')}
            disabled={isLoading}
          />
          {errors.confirm_password && (
            <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}

'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const isEmployer = searchParams.get('role') === 'employer'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          {isEmployer
            ? 'Get started and find the best talent for your team'
            : 'Get started and find your dream job'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader />
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  )
}

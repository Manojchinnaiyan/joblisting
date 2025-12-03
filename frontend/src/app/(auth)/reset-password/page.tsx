import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader />
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  )
}

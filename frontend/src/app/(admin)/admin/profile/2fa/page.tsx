'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { useAdminAuthStore } from '@/store/admin-auth-store'
import { useAdminProfile, useEnable2FA, useDisable2FA, useVerifyEnable2FA } from '@/hooks/admin'
import { toast } from 'sonner'

export default function TwoFactorPage() {
  const { user, setUser } = useAdminAuthStore()
  const { data: profile } = useAdminProfile()
  const enable2FA = useEnable2FA()
  const disable2FA = useDisable2FA()
  const verifyEnable2FA = useVerifyEnable2FA()

  const [setupData, setSetupData] = useState<{ secret: string; qr_code: string } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [copied, setCopied] = useState(false)

  const currentUser = profile || user
  const is2FAEnabled = currentUser?.two_factor_enabled

  const handleStartSetup = async () => {
    try {
      const result = await enable2FA.mutateAsync()
      setSetupData(result)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleVerifySetup = async () => {
    if (!setupData || verificationCode.length !== 6) return

    try {
      await verifyEnable2FA.mutateAsync({ code: verificationCode })
      setSetupData(null)
      setVerificationCode('')
      // Update user state
      if (user) {
        setUser({ ...user, two_factor_enabled: true })
      }
      toast.success('Two-factor authentication enabled successfully')
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) return

    try {
      await disable2FA.mutateAsync({ code: disableCode })
      setShowDisableDialog(false)
      setDisableCode('')
      // Update user state
      if (user) {
        setUser({ ...user, two_factor_enabled: false })
      }
      toast.success('Two-factor authentication disabled')
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleCopySecret = async () => {
    if (!setupData?.secret) return
    await navigator.clipboard.writeText(setupData.secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Secret copied to clipboard')
  }

  const handleCancelSetup = () => {
    setSetupData(null)
    setVerificationCode('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
          <Link href="/admin/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Two-Factor Authentication</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account security</p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>2FA Status</CardTitle>
              <CardDescription>
                Two-factor authentication adds an extra layer of security
              </CardDescription>
            </div>
            {is2FAEnabled ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <ShieldCheck className="mr-1 h-4 w-4" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">
                <ShieldOff className="mr-1 h-4 w-4" />
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {is2FAEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your account is protected with two-factor authentication. You will need to enter a
                code from your authenticator app when signing in.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Disable 2FA
              </Button>
            </div>
          ) : setupData ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={setupData.qr_code}
                    alt="2FA QR Code"
                    className="w-48 h-48 border rounded-lg"
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Or enter this secret manually:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded text-sm font-mono">
                    {setupData.secret}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopySecret}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to verify:
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleCancelSetup}>
                  Cancel
                </Button>
                <Button
                  onClick={handleVerifySetup}
                  disabled={verificationCode.length !== 6 || verifyEnable2FA.isPending}
                >
                  {verifyEnable2FA.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Enable 2FA'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an additional layer of security to your account by
                requiring a code from an authenticator app when signing in.
              </p>
              <Button onClick={handleStartSetup} disabled={enable2FA.isPending}>
                {enable2FA.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Enable 2FA
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Why use 2FA?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Enhanced Security:</strong> Even if your
                password is compromised, attackers cannot access your account without the second
                factor.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Protection Against Phishing:</strong> 2FA codes
                are time-sensitive and cannot be reused, making phishing attacks less effective.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Industry Standard:</strong> Two-factor
                authentication is recommended by security experts and required for admin accounts.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Disable Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the extra security layer from your account. You&apos;ll only need your
              password to sign in. Enter your current 2FA code to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center py-4">
            <InputOTP
              maxLength={6}
              value={disableCode}
              onChange={setDisableCode}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisableCode('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable2FA}
              className="bg-destructive hover:bg-destructive/90"
              disabled={disableCode.length !== 6 || disable2FA.isPending}
            >
              {disable2FA.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable 2FA'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

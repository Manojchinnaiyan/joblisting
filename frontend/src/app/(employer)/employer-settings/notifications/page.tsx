'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useNotificationPreferences, useUpdatePreferences } from '@/hooks/use-notifications'
import { NotificationPreferences } from '@/lib/api/notifications'

export default function EmployerNotificationPreferencesPage() {
  const { data: preferences, isLoading } = useNotificationPreferences()
  const updatePreferences = useUpdatePreferences()
  const [formData, setFormData] = useState<Partial<NotificationPreferences>>({})

  useEffect(() => {
    if (preferences) {
      setFormData(preferences)
    }
  }, [preferences])

  const handleToggle = (key: keyof NotificationPreferences) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = () => {
    updatePreferences.mutate(formData)
  }

  if (isLoading) {
    return <div className="p-12 text-center">Loading preferences...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground">Choose how you want to be notified</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Receive notifications via email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email_new_application">New applications</Label>
            <Switch
              id="email_new_application"
              checked={formData.email_new_application ?? false}
              onCheckedChange={() => handleToggle('email_new_application')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="email_job_expiring">Job expiring soon</Label>
            <Switch
              id="email_job_expiring"
              checked={formData.email_job_expiring ?? false}
              onCheckedChange={() => handleToggle('email_job_expiring')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="email_company_review">Company reviews</Label>
            <Switch
              id="email_company_review"
              checked={formData.email_company_review ?? false}
              onCheckedChange={() => handleToggle('email_company_review')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="email_job_moderation">Job moderation updates</Label>
            <Switch
              id="email_job_moderation"
              checked={formData.email_job_moderation ?? false}
              onCheckedChange={() => handleToggle('email_job_moderation')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="email_company_verification">Company verification updates</Label>
            <Switch
              id="email_company_verification"
              checked={formData.email_company_verification ?? false}
              onCheckedChange={() => handleToggle('email_company_verification')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="email_team_invitation">Team invitations</Label>
            <Switch
              id="email_team_invitation"
              checked={formData.email_team_invitation ?? false}
              onCheckedChange={() => handleToggle('email_team_invitation')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>Receive notifications in the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="app_new_application">New applications</Label>
            <Switch
              id="app_new_application"
              checked={formData.app_new_application ?? false}
              onCheckedChange={() => handleToggle('app_new_application')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="app_job_expiring">Job expiring soon</Label>
            <Switch
              id="app_job_expiring"
              checked={formData.app_job_expiring ?? false}
              onCheckedChange={() => handleToggle('app_job_expiring')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="app_company_review">Company reviews</Label>
            <Switch
              id="app_company_review"
              checked={formData.app_company_review ?? false}
              onCheckedChange={() => handleToggle('app_company_review')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="app_job_moderation">Job moderation updates</Label>
            <Switch
              id="app_job_moderation"
              checked={formData.app_job_moderation ?? false}
              onCheckedChange={() => handleToggle('app_job_moderation')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="app_company_verification">Company verification updates</Label>
            <Switch
              id="app_company_verification"
              checked={formData.app_company_verification ?? false}
              onCheckedChange={() => handleToggle('app_company_verification')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="app_team_invitation">Team invitations</Label>
            <Switch
              id="app_team_invitation"
              checked={formData.app_team_invitation ?? false}
              onCheckedChange={() => handleToggle('app_team_invitation')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updatePreferences.isPending}>
          {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}

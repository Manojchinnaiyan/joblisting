'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useNotificationPreferences, useUpdatePreferences } from '@/hooks/use-notifications'
import { NotificationPreferences } from '@/lib/api/notifications'

export default function NotificationPreferencesPage() {
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
            <Label htmlFor="email_application_status">Application status updates</Label>
            <Switch
              id="email_application_status"
              checked={formData.email_application_status ?? false}
              onCheckedChange={() => handleToggle('email_application_status')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="email_new_job">New jobs from followed companies</Label>
            <Switch
              id="email_new_job"
              checked={formData.email_new_job ?? false}
              onCheckedChange={() => handleToggle('email_new_job')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="email_profile_viewed">Profile views</Label>
            <Switch
              id="email_profile_viewed"
              checked={formData.email_profile_viewed ?? false}
              onCheckedChange={() => handleToggle('email_profile_viewed')}
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
            <Label htmlFor="app_application_status">Application status updates</Label>
            <Switch
              id="app_application_status"
              checked={formData.app_application_status ?? false}
              onCheckedChange={() => handleToggle('app_application_status')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="app_new_job">New jobs from followed companies</Label>
            <Switch
              id="app_new_job"
              checked={formData.app_new_job ?? false}
              onCheckedChange={() => handleToggle('app_new_job')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="app_profile_viewed">Profile views</Label>
            <Switch
              id="app_profile_viewed"
              checked={formData.app_profile_viewed ?? false}
              onCheckedChange={() => handleToggle('app_profile_viewed')}
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

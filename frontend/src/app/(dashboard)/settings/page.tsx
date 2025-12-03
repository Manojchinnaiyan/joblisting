'use client'

import Link from 'next/link'
import { Key, Trash2, User, Bell, Shield, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useProfile } from '@/hooks/use-profile'

export default function SettingsPage() {
  const { data: profile } = useProfile()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile?.email || 'Not set'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Name</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Not set'}
                </p>
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Edit Profile
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/settings/change-password"
            className="flex items-center justify-between py-3 hover:bg-accent rounded-lg px-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">
                  Update your account password
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Coming soon
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Control your privacy settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/profile/edit"
            className="flex items-center justify-between py-3 hover:bg-accent rounded-lg px-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Profile Visibility</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.visibility || 'Not set'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/settings/delete-account"
            className="flex items-center justify-between py-3 hover:bg-red-50 rounded-lg px-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-600">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Switch } from '@/components/ui/switch'
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '@/hooks/use-profile'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, X } from 'lucide-react'
import { useState } from 'react'

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(255),
  last_name: z.string().min(1, 'Last name is required').max(255),
  headline: z.string().max(255).optional(),
  bio: z.string().max(2000).optional(),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  current_title: z.string().max(255).optional(),
  current_company: z.string().max(255).optional(),
  years_of_experience: z.number().min(0).optional(),
  expected_salary_min: z.number().min(0).optional(),
  expected_salary_max: z.number().min(0).optional(),
  salary_currency: z.string().max(10).optional(),
  notice_period: z.number().min(0).optional(),
  available_from: z.string().optional(),
  open_to_opportunities: z.boolean(),
  linkedin_url: z.string().url('Invalid URL').or(z.literal('')).optional(),
  github_url: z.string().url('Invalid URL').or(z.literal('')).optional(),
  portfolio_url: z.string().url('Invalid URL').or(z.literal('')).optional(),
  website_url: z.string().url('Invalid URL').or(z.literal('')).optional(),
  visibility: z.enum(['PUBLIC', 'EMPLOYERS_ONLY', 'PRIVATE']),
  show_email: z.boolean(),
  show_phone: z.boolean(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function EditProfilePage() {
  const router = useRouter()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const deleteAvatar = useDeleteAvatar()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      headline: '',
      bio: '',
      phone: '',
      date_of_birth: '',
      city: '',
      state: '',
      country: '',
      current_title: '',
      current_company: '',
      years_of_experience: undefined,
      expected_salary_min: undefined,
      expected_salary_max: undefined,
      salary_currency: 'USD',
      notice_period: undefined,
      available_from: '',
      open_to_opportunities: false,
      linkedin_url: '',
      github_url: '',
      portfolio_url: '',
      website_url: '',
      visibility: 'PUBLIC',
      show_email: false,
      show_phone: false,
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        current_title: profile.current_title || '',
        current_company: profile.current_company || '',
        years_of_experience: profile.years_of_experience ?? undefined,
        expected_salary_min: profile.expected_salary_min ?? undefined,
        expected_salary_max: profile.expected_salary_max ?? undefined,
        salary_currency: profile.salary_currency || 'USD',
        notice_period: profile.notice_period ?? undefined,
        available_from: profile.available_from || '',
        open_to_opportunities: profile.open_to_opportunities ?? false,
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        portfolio_url: profile.portfolio_url || '',
        website_url: profile.website_url || '',
        visibility: profile.visibility || 'PUBLIC',
        show_email: profile.show_email ?? false,
        show_phone: profile.show_phone ?? false,
      })
    }
  }, [profile, form])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (avatarFile) {
      await uploadAvatar.mutateAsync(avatarFile)
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }

  const handleAvatarDelete = async () => {
    await deleteAvatar.mutateAsync()
    setAvatarPreview(null)
  }

  // Unsaved changes protection
  const {
    showDialog: showDiscardDialog,
    setShowDialog: setShowDiscardDialog,
    handleDiscard,
    handleContinue: handleContinueEditing,
    navigateWithCheck,
  } = useUnsavedChanges({
    isDirty: form.formState.isDirty,
  })

  const onSubmit = async (data: ProfileFormValues) => {
    await updateProfile.mutateAsync(data)
    router.push('/profile')
  }

  const handleCancel = () => {
    navigateWithCheck('/profile')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground mt-1">
          Update your professional information
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.first_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Change Photo
                    </Button>
                    {(profile?.avatar_url || avatarPreview) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAvatarDelete}
                        disabled={deleteAvatar.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  {avatarFile && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAvatarUpload}
                      disabled={uploadAvatar.isPending}
                    >
                      Upload New Photo
                    </Button>
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG or PNG. Max 2MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headline"
                render={({ field: { value, ...field } }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Professional Headline</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} placeholder="e.g. Senior Software Engineer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field: { value, ...field } }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={value || ''} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Current Position */}
          <Card>
            <CardHeader>
              <CardTitle>Current Position</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="current_title"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Current Title</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_company"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Current Company</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="years_of_experience"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} placeholder="https://linkedin.com/in/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="github_url"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>GitHub</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} placeholder="https://github.com/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolio_url"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Portfolio</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website_url"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} value={value || ''} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Visibility</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="EMPLOYERS_ONLY">Employers Only</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="show_email"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Show Email</FormLabel>
                      <FormDescription>
                        Display your email on your profile
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="show_phone"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Show Phone</FormLabel>
                      <FormDescription>
                        Display your phone number on your profile
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="open_to_opportunities"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Open to Opportunities</FormLabel>
                      <FormDescription>
                        Show recruiters you&apos;re open to new opportunities
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Spacer for sticky footer */}
          <div className="h-20" />
        </form>
      </Form>

      {/* Sticky Footer */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:bottom-0 lg:left-64">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateProfile.isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleContinueEditing}>
              Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

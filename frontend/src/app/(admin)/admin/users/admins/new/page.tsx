'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCreateAdmin } from '@/hooks/admin'

const createAdminSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirm_password: z.string(),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
  require_2fa: z.boolean().default(true),
  send_welcome_email: z.boolean().default(true),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

type CreateAdminValues = z.infer<typeof createAdminSchema>

const availablePermissions = [
  { id: 'users.read', label: 'View Users', description: 'Can view user information' },
  { id: 'users.write', label: 'Manage Users', description: 'Can create, edit, and delete users' },
  { id: 'companies.read', label: 'View Companies', description: 'Can view company information' },
  { id: 'companies.write', label: 'Manage Companies', description: 'Can verify, edit, and manage companies' },
  { id: 'jobs.read', label: 'View Jobs', description: 'Can view job listings' },
  { id: 'jobs.write', label: 'Manage Jobs', description: 'Can approve, edit, and delete jobs' },
  { id: 'reviews.read', label: 'View Reviews', description: 'Can view company reviews' },
  { id: 'reviews.write', label: 'Moderate Reviews', description: 'Can approve, reject, and delete reviews' },
  { id: 'settings.read', label: 'View Settings', description: 'Can view platform settings' },
  { id: 'settings.write', label: 'Manage Settings', description: 'Can modify platform settings' },
  { id: 'analytics.read', label: 'View Analytics', description: 'Can view platform analytics' },
  { id: 'admins.write', label: 'Manage Admins', description: 'Can create and manage other admins' },
]

export default function CreateAdminPage() {
  const router = useRouter()
  const createAdmin = useCreateAdmin()

  const form = useForm<CreateAdminValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      confirm_password: '',
      permissions: ['users.read', 'companies.read', 'jobs.read', 'reviews.read', 'analytics.read'],
      require_2fa: true,
      send_welcome_email: true,
    },
  })

  const onSubmit = async (data: CreateAdminValues) => {
    await createAdmin.mutateAsync({
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      password: data.password,
      permissions: data.permissions,
      require_2fa: data.require_2fa,
      send_welcome_email: data.send_welcome_email,
    })
    router.push('/admin/users/admins')
  }

  const selectAllPermissions = () => {
    form.setValue('permissions', availablePermissions.map((p) => p.id))
  }

  const clearAllPermissions = () => {
    form.setValue('permissions', [])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
          <Link href="/admin/users/admins">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Create Administrator</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Add a new administrator to the platform</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Basic information for the new administrator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be the administrator&apos;s login email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription>
                        Must be 8+ characters with uppercase, lowercase, number, and special character
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>Select the permissions for this administrator</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAllPermissions}>
                    Select All
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearAllPermissions}>
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {availablePermissions.map((permission) => (
                        <FormField
                          key={permission.id}
                          control={form.control}
                          name="permissions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={permission.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, permission.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== permission.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-medium cursor-pointer">
                                    {permission.label}
                                  </FormLabel>
                                  <FormDescription className="text-xs">
                                    {permission.description}
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security options for this administrator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="require_2fa"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Require Two-Factor Authentication</FormLabel>
                      <FormDescription>
                        Administrator will be required to set up 2FA on first login
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="send_welcome_email"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Send Welcome Email</FormLabel>
                      <FormDescription>
                        Send an email with login instructions to the new administrator
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/users/admins">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createAdmin.isPending}>
              {createAdmin.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Administrator
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

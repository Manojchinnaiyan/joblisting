'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Edit,
  Ban,
  CheckCircle,
  Trash2,
  Mail,
  Shield,
  ShieldCheck,
  ShieldOff,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  Building2,
  FileText,
  Eye,
  Globe,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminUser,
  useUserLoginHistory,
  useSuspendUser,
  useActivateUser,
  useDeleteUser,
} from '@/hooks/admin'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function UserDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [actionDialog, setActionDialog] = useState<'suspend' | 'activate' | 'delete' | null>(null)

  const { data: user, isLoading } = useAdminUser(id)
  const { data: loginHistory, isLoading: loginHistoryLoading } = useUserLoginHistory(id)
  const suspendUser = useSuspendUser()
  const activateUser = useActivateUser()
  const deleteUser = useDeleteUser()

  const handleAction = async () => {
    try {
      switch (actionDialog) {
        case 'suspend':
          await suspendUser.mutateAsync({ id })
          break
        case 'activate':
          await activateUser.mutateAsync(id)
          break
        case 'delete':
          await deleteUser.mutateAsync(id)
          router.push('/admin/users')
          break
      }
    } finally {
      setActionDialog(null)
    }
  }

  if (isLoading) {
    return <UserDetailSkeleton />
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">User Not Found</h2>
        <p className="text-muted-foreground mt-2">The user you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">User Details</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">View and manage user information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/users/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Link>
          </Button>
          {user.status === 'ACTIVE' ? (
            <Button
              variant="outline"
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
              onClick={() => setActionDialog('suspend')}
            >
              <Ban className="mr-2 h-4 w-4" />
              Suspend
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => setActionDialog('activate')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setActionDialog('delete')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profile?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {user.first_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={
                    user.role === 'ADMIN' ? 'default' : user.role === 'EMPLOYER' ? 'secondary' : 'outline'
                  }
                >
                  {user.role === 'JOB_SEEKER' ? 'Job Seeker' : user.role === 'EMPLOYER' ? 'Employer' : user.role === 'ADMIN' ? 'Admin' : user.role}
                </Badge>
                <Badge
                  variant={
                    user.status === 'ACTIVE'
                      ? 'default'
                      : user.status === 'SUSPENDED'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className={
                    user.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100'
                      : ''
                  }
                >
                  {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1).toLowerCase() : 'Unknown'}
                </Badge>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
              {user.profile?.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined {user.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : '-'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Last login:{' '}
                  {user.last_login_at
                    ? format(new Date(user.last_login_at), 'MMM d, yyyy HH:mm')
                    : 'Never'}
                </span>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Verified</span>
                {user.email_verified ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not Verified</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">2FA</span>
                {user.is_2fa_enabled ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <ShieldOff className="mr-1 h-3 w-3" />
                    Disabled
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <a href={`mailto:${user.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="login-history">Login History</TabsTrigger>
              {user.role === 'EMPLOYER' && (
                <TabsTrigger value="company">Company</TabsTrigger>
              )}
              {user.role === 'JOB_SEEKER' && (
                <TabsTrigger value="applications">Applications</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">User ID</dt>
                      <dd className="text-sm font-medium font-mono">{user.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Email</dt>
                      <dd className="text-sm font-medium">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">First Name</dt>
                      <dd className="text-sm font-medium">{user.first_name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Last Name</dt>
                      <dd className="text-sm font-medium">{user.last_name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Role</dt>
                      <dd className="text-sm font-medium capitalize">
                        {user.role === 'JOB_SEEKER' ? 'Job Seeker' : user.role === 'EMPLOYER' ? 'Employer' : user.role === 'ADMIN' ? 'Admin' : user.role}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Status</dt>
                      <dd className="text-sm font-medium capitalize">{user.status}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Created At</dt>
                      <dd className="text-sm font-medium">
                        {user.created_at ? format(new Date(user.created_at), 'PPpp') : '-'}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {user.profile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      {user.profile.headline && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm text-muted-foreground">Headline</dt>
                          <dd className="text-sm font-medium">{user.profile.headline}</dd>
                        </div>
                      )}
                      {user.profile.bio && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm text-muted-foreground">Bio</dt>
                          <dd className="text-sm font-medium">{user.profile.bio}</dd>
                        </div>
                      )}
                      {user.profile.website && (
                        <div>
                          <dt className="text-sm text-muted-foreground">Website</dt>
                          <dd className="text-sm font-medium">
                            <a
                              href={user.profile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {user.profile.website}
                            </a>
                          </dd>
                        </div>
                      )}
                      {user.profile.linkedin_url && (
                        <div>
                          <dt className="text-sm text-muted-foreground">LinkedIn</dt>
                          <dd className="text-sm font-medium">
                            <a
                              href={user.profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View Profile
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>User&apos;s recent actions on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {user.recentActivity && user.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {user.recentActivity.map((activity: any, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="rounded-full p-2 bg-muted">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.timestamp ? format(new Date(activity.timestamp), 'PPpp') : '-'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No recent activity
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="login-history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Login History</CardTitle>
                  <CardDescription>Recent login attempts and sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  {loginHistoryLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : loginHistory?.history && loginHistory.history.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loginHistory.history.map((login, index) => (
                          <TableRow key={login.id || `login-${index}`}>
                            <TableCell>
                              {login.created_at ? format(new Date(login.created_at), 'MMM d, yyyy HH:mm') : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {login.ip_address}
                            </TableCell>
                            <TableCell>-</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {login.user_agent || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={login.status === 'SUCCESS' ? 'default' : 'destructive'}
                                className={
                                  login.status === 'SUCCESS'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                    : ''
                                }
                              >
                                {login.status === 'SUCCESS' ? 'Success' : login.status === 'FAILED' ? 'Failed' : 'Locked'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No login history available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {user.role === 'EMPLOYER' && (
              <TabsContent value="company" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>Company associated with this employer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.company ? (
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={user.company.logo_url} />
                          <AvatarFallback>
                            {user.company.name?.charAt(0)?.toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{user.company.name}</h3>
                          {user.company.industry && (
                            <p className="text-sm text-muted-foreground">
                              {user.company.industry}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {user.company.is_verified && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                            {user.company.is_featured && (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <Button variant="outline" size="sm" className="mt-4" asChild>
                            <Link href={`/admin/companies/${user.company.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Company
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No company associated
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {user.role === 'JOB_SEEKER' && (
              <TabsContent value="applications" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Applications</CardTitle>
                    <CardDescription>Recent job applications by this user</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.applications && user.applications.length > 0 ? (
                      <div className="space-y-4">
                        {user.applications.map((application: any) => (
                          <div
                            key={application.id}
                            className="flex items-center justify-between border rounded-lg p-4"
                          >
                            <div>
                              <h4 className="font-medium">{application.job_title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {application.company_name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Applied {application.created_at ? format(new Date(application.created_at), 'MMM d, yyyy') : '-'}
                              </p>
                            </div>
                            <Badge
                              variant={
                                application.status === 'accepted'
                                  ? 'default'
                                  : application.status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {application.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No applications found
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Action Dialogs */}
      <AlertDialog open={actionDialog === 'suspend'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend {user.first_name} {user.last_name}?
              They will not be able to access their account until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Suspend User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'activate'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate {user.first_name} {user.last_name}?
              They will regain access to their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-green-600 hover:bg-green-700"
            >
              Activate User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'delete'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {user.first_name} {user.last_name}?
              This action cannot be undone. All user data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 mt-4" />
              <Skeleton className="h-4 w-40 mt-2" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Skeleton className="h-10 w-96" />
          <Card className="mt-4">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-32 mt-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { isValidDate } from '@/lib/utils'
import {
  ArrowLeft,
  Edit,
  Ban,
  CheckCircle,
  Trash2,
  Star,
  StarOff,
  Shield,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  Globe,
  Mail,
  Phone,
  Building2,
  ExternalLink,
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
  useAdminCompany,
  useVerifyCompany,
  useFeatureCompany,
  useUnfeatureCompany,
  useSuspendCompany,
  useDeleteCompany,
} from '@/hooks/admin'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CompanyDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [actionDialog, setActionDialog] = useState<
    'verify' | 'feature' | 'unfeature' | 'suspend' | 'delete' | null
  >(null)

  const { data: company, isLoading } = useAdminCompany(id)
  const verifyCompany = useVerifyCompany()
  const featureCompany = useFeatureCompany()
  const unfeatureCompany = useUnfeatureCompany()
  const suspendCompany = useSuspendCompany()
  const deleteCompany = useDeleteCompany()

  const handleAction = async () => {
    try {
      switch (actionDialog) {
        case 'verify':
          await verifyCompany.mutateAsync(id)
          break
        case 'feature':
          await featureCompany.mutateAsync({ id })
          break
        case 'unfeature':
          await unfeatureCompany.mutateAsync(id)
          break
        case 'suspend':
          await suspendCompany.mutateAsync({ id })
          break
        case 'delete':
          await deleteCompany.mutateAsync(id)
          router.push('/admin/companies')
          break
      }
    } finally {
      setActionDialog(null)
    }
  }

  if (isLoading) {
    return <CompanyDetailSkeleton />
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">Company Not Found</h2>
        <p className="text-muted-foreground mt-2">The company you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
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
            <Link href="/admin/companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Company Details</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">View and manage company information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/companies/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {!company.is_verified && (
            <Button
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={() => setActionDialog('verify')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Verify
            </Button>
          )}
          {company.is_featured ? (
            <Button variant="outline" onClick={() => setActionDialog('unfeature')}>
              <StarOff className="mr-2 h-4 w-4" />
              Unfeature
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              onClick={() => setActionDialog('feature')}
            >
              <Star className="mr-2 h-4 w-4" />
              Feature
            </Button>
          )}
          {company.status !== 'SUSPENDED' ? (
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
              onClick={() => setActionDialog('verify')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Reactivate
            </Button>
          )}
          <Button variant="destructive" onClick={() => setActionDialog('delete')}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Company Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={company.logo_url} />
                <AvatarFallback className="text-2xl">
                  {company.name?.charAt(0)?.toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold text-center">{company.name}</h2>
              {company.tagline && (
                <p className="text-muted-foreground text-center text-sm mt-1">{company.tagline}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                {company.is_verified && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    <Shield className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {company.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                    <Star className="mr-1 h-3 w-3 fill-yellow-600" />
                    Featured
                  </Badge>
                )}
                <Badge
                  variant={
                    company.status === 'ACTIVE'
                      ? 'default'
                      : company.status === 'SUSPENDED'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className={
                    company.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100'
                      : ''
                  }
                >
                  {company.status ? company.status.charAt(0).toUpperCase() + company.status.slice(1).toLowerCase() : 'Unknown'}
                </Badge>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              {company.industry && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{company.industry}</span>
                </div>
              )}
              {company.company_size && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{company.company_size} employees</span>
                </div>
              )}
              {company.locations && company.locations.length > 0 && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{company.locations[0].city}{company.locations[0].country && `, ${company.locations[0].country}`}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {company.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${company.email}`} className="text-sm text-primary hover:underline">
                    {company.email}
                  </a>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{company.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined {isValidDate(company.created_at) ? format(new Date(company.created_at), 'MMMM d, yyyy') : '-'}
                </span>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{company.active_jobs_count || 0}</p>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{company.reviews_count || 0}</p>
                <p className="text-sm text-muted-foreground">Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  {company.description ? (
                    <p className="text-sm whitespace-pre-wrap">{company.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No description provided.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Company ID</dt>
                      <dd className="text-sm font-medium font-mono">{company.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Slug</dt>
                      <dd className="text-sm font-medium">{company.slug}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Founded</dt>
                      <dd className="text-sm font-medium">{company.founded_year || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Company Type</dt>
                      <dd className="text-sm font-medium capitalize">
                        {company.company_type || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Created At</dt>
                      <dd className="text-sm font-medium">
                        {isValidDate(company.created_at) ? format(new Date(company.created_at), 'PPpp') : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Last Updated</dt>
                      <dd className="text-sm font-medium">
                        {isValidDate(company.updated_at)
                          ? format(new Date(company.updated_at!), 'PPpp')
                          : '-'}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Owner Info */}
              {company.owner && (
                <Card>
                  <CardHeader>
                    <CardTitle>Company Owner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={company.owner.avatar_url} />
                        <AvatarFallback>
                          {company.owner.first_name?.charAt(0) || company.owner.email?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/admin/users/${company.owner.id}`}
                          className="font-medium hover:underline"
                        >
                          {company.owner.first_name} {company.owner.last_name}
                        </Link>
                        <p className="text-sm text-muted-foreground">{company.owner.email}</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto" asChild>
                        <Link href={`/admin/users/${company.owner.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Listings</CardTitle>
                  <CardDescription>All jobs posted by this company</CardDescription>
                </CardHeader>
                <CardContent>
                  {company.jobs && company.jobs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Posted</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {company.jobs.map((job: any) => (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.title}</TableCell>
                            <TableCell>{job.job_type}</TableCell>
                            <TableCell>{job.location || 'Remote'}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  job.status === 'ACTIVE'
                                    ? 'default'
                                    : job.status === 'PENDING_APPROVAL'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {job.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {isValidDate(job.created_at) ? format(new Date(job.created_at), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/jobs/${job.id}`}>View</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No job listings yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>People associated with this company</CardDescription>
                </CardHeader>
                <CardContent>
                  {company.team_members && company.team_members.length > 0 ? (
                    <div className="space-y-4">
                      {company.team_members.map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between border rounded-lg p-4"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback>
                                {member.first_name?.charAt(0) || member.email?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {member.first_name} {member.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/users/${member.user_id}`}>View</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No team members
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Reviews</CardTitle>
                  <CardDescription>Reviews from employees and applicants</CardDescription>
                </CardHeader>
                <CardContent>
                  {company.reviews && company.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {company.reviews.map((review: any) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">{review.rating}/5</Badge>
                              <span className="text-sm text-muted-foreground">
                                {isValidDate(review.created_at) ? format(new Date(review.created_at), 'MMM d, yyyy') : '-'}
                              </span>
                            </div>
                            <Badge
                              variant={
                                review.status === 'APPROVED'
                                  ? 'default'
                                  : review.status === 'PENDING'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {review.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{review.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                          <Button variant="ghost" size="sm" className="mt-2" asChild>
                            <Link href={`/admin/reviews?id=${review.id}`}>Manage Review</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No reviews yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Action Dialogs */}
      <AlertDialog open={actionDialog === 'verify'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify {company.name}? This will mark the company as verified
              and display a verification badge on their profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-blue-600 hover:bg-blue-700">
              Verify Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'feature'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Feature Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to feature {company.name}? Featured companies appear prominently
              on the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-yellow-600 hover:bg-yellow-700">
              Feature Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'unfeature'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Featured Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the featured status from {company.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Remove Featured</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'suspend'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend {company.name}? All their job listings will be hidden
              and they won&apos;t be able to post new jobs until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-orange-600 hover:bg-orange-700">
              Suspend Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'delete'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {company.name}? This action cannot be undone. All
              company data, job listings, and associated information will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CompanyDetailSkeleton() {
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
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-40 mt-4" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Skeleton className="h-10 w-96" />
          <Card className="mt-4">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

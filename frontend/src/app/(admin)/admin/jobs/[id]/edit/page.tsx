'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Building2, Briefcase, MapPin, DollarSign, Users, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminJob, useUpdateAdminJob } from '@/hooks/admin'
import { useAdminCategories } from '@/hooks/admin/use-admin-categories'
import { UpdateJobData } from '@/lib/api/admin/jobs'

const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  description: z.string().min(100, 'Description must be at least 100 characters'),
  short_description: z.string().max(500).optional(),
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(255),
  company_logo_url: z.string().url().optional().or(z.literal('')),
  job_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']),
  experience_level: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']),
  workplace_type: z.enum(['ONSITE', 'REMOTE', 'HYBRID']),
  location: z.string().min(1, 'Location is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  salary_currency: z.string().optional(),
  salary_period: z.string().optional(),
  hide_salary: z.boolean().optional(),
  skills: z.string().optional(),
  education: z.string().optional(),
  years_experience_min: z.coerce.number().min(0).optional(),
  years_experience_max: z.coerce.number().optional(),
  benefits: z.string().optional(),
  category_ids: z.array(z.string()).optional(),
  application_url: z.string().url().optional().or(z.literal('')),
  application_email: z.string().email().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'DRAFT', 'PENDING_APPROVAL', 'EXPIRED', 'CLOSED', 'REJECTED']).optional(),
})

type JobFormData = z.infer<typeof jobSchema>

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship' },
]

const EXPERIENCE_LEVELS = [
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'MID', label: 'Mid Level' },
  { value: 'SENIOR', label: 'Senior Level' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'EXECUTIVE', label: 'Executive' },
]

const WORKPLACE_TYPES = [
  { value: 'ONSITE', label: 'On-site' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
]

const SALARY_CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'INR', label: 'INR' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
]

const SALARY_PERIODS = [
  { value: 'HOURLY', label: 'Per Hour' },
  { value: 'DAILY', label: 'Per Day' },
  { value: 'WEEKLY', label: 'Per Week' },
  { value: 'MONTHLY', label: 'Per Month' },
  { value: 'YEARLY', label: 'Per Year' },
]

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REJECTED', label: 'Rejected' },
]

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const { data: job, isLoading: isLoadingJob } = useAdminJob(jobId)
  const updateJob = useUpdateAdminJob()
  const { data: categoriesData } = useAdminCategories()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
  })

  // Load job data into form when job is fetched
  useEffect(() => {
    if (job) {
      reset({
        title: job.title || '',
        description: job.description || '',
        short_description: job.short_description || '',
        company_name: job.company_name || '',
        company_logo_url: job.company_logo || '',
        job_type: (job.job_type as any) || 'FULL_TIME',
        experience_level: (job.experience_level as any) || 'MID',
        workplace_type: (job.workplace_type as any) || 'ONSITE',
        location: job.location || '',
        city: job.city || '',
        state: job.state || '',
        country: job.country || '',
        salary_min: job.salary_min || undefined,
        salary_max: job.salary_max || undefined,
        salary_currency: job.salary_currency || 'USD',
        salary_period: job.salary_period || 'YEARLY',
        hide_salary: job.is_salary_visible === false,
        skills: job.skills?.join(', ') || '',
        education: job.education || '',
        years_experience_min: job.years_experience_min || undefined,
        years_experience_max: job.years_experience_max || undefined,
        benefits: job.benefits?.join(', ') || '',
        application_url: job.external_apply_url || '',
        application_email: job.application_email || '',
        status: (job.status as any) || 'ACTIVE',
      })

      // Set categories
      if (job.category?.id) {
        setSelectedCategories([job.category.id])
      }
    }
  }, [job, reset])

  const onSubmit = async (data: JobFormData) => {
    const updateData: UpdateJobData = {
      title: data.title,
      description: data.description,
      short_description: data.short_description || undefined,
      company_name: data.company_name,
      company_logo_url: data.company_logo_url || undefined,
      job_type: data.job_type,
      experience_level: data.experience_level,
      workplace_type: data.workplace_type,
      location: data.location,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      salary_min: data.salary_min || undefined,
      salary_max: data.salary_max || undefined,
      salary_currency: data.salary_currency || undefined,
      salary_period: data.salary_period || undefined,
      hide_salary: data.hide_salary || undefined,
      skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      education: data.education || undefined,
      years_experience_min: data.years_experience_min || undefined,
      years_experience_max: data.years_experience_max || undefined,
      benefits: data.benefits ? data.benefits.split(',').map(b => b.trim()).filter(Boolean) : undefined,
      category_ids: selectedCategories.length > 0 ? selectedCategories : undefined,
      application_url: data.application_url || undefined,
      application_email: data.application_email || undefined,
      status: data.status || 'ACTIVE',
    }

    try {
      await updateJob.mutateAsync({ id: jobId, data: updateData })
      router.push(`/admin/jobs/${jobId}`)
    } catch (error) {
      // Error handled by the hook
    }
  }

  const categories = categoriesData?.categories || []

  if (isLoadingJob) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Job not found</h2>
        <p className="text-muted-foreground mt-2">The job you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/jobs">Back to Jobs</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/jobs/${jobId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Job</h1>
          <p className="text-sm text-muted-foreground">
            Update job listing details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Company details for this job posting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  placeholder="e.g., Acme Inc."
                  {...register('company_name')}
                />
                {errors.company_name && (
                  <p className="text-sm text-destructive">{errors.company_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_logo_url">Company Logo URL</Label>
                <Input
                  id="company_logo_url"
                  placeholder="https://example.com/logo.png"
                  {...register('company_logo_url')}
                />
                {errors.company_logo_url && (
                  <p className="text-sm text-destructive">{errors.company_logo_url.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Details
            </CardTitle>
            <CardDescription>
              Basic information about the job position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Software Engineer"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Textarea
                id="short_description"
                placeholder="Brief summary of the job (max 500 characters)"
                rows={2}
                {...register('short_description')}
              />
              {errors.short_description && (
                <p className="text-sm text-destructive">{errors.short_description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed job description (minimum 100 characters)"
                rows={8}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Job Type *</Label>
                <Select
                  value={watch('job_type')}
                  onValueChange={(value) => setValue('job_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select
                  value={watch('experience_level')}
                  onValueChange={(value) => setValue('experience_level', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Workplace Type *</Label>
                <Select
                  value={watch('workplace_type')}
                  onValueChange={(value) => setValue('workplace_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKPLACE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Categories</Label>
                <Select
                  onValueChange={(value) => {
                    if (!selectedCategories.includes(value)) {
                      setSelectedCategories([...selectedCategories, value])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCategories.map((catId) => {
                      const cat = categories.find((c: any) => c.id === catId)
                      return (
                        <span
                          key={catId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                        >
                          {cat?.name}
                          <button
                            type="button"
                            onClick={() => setSelectedCategories(selectedCategories.filter(id => id !== catId))}
                            className="hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  {...register('location')}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., San Francisco"
                  {...register('city')}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  placeholder="e.g., California"
                  {...register('state')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="e.g., United States"
                  {...register('country')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="salary_min">Minimum Salary</Label>
                <Input
                  id="salary_min"
                  type="number"
                  placeholder="e.g., 80000"
                  {...register('salary_min')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_max">Maximum Salary</Label>
                <Input
                  id="salary_max"
                  type="number"
                  placeholder="e.g., 120000"
                  {...register('salary_max')}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={watch('salary_currency')}
                  onValueChange={(value) => setValue('salary_currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALARY_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={watch('salary_period')}
                  onValueChange={(value) => setValue('salary_period', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALARY_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide_salary"
                checked={watch('hide_salary')}
                onCheckedChange={(checked) => setValue('hide_salary', checked as boolean)}
              />
              <Label htmlFor="hide_salary" className="text-sm font-normal">
                Hide salary from job posting
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills</Label>
              <Input
                id="skills"
                placeholder="e.g., JavaScript, React, Node.js (comma-separated)"
                {...register('skills')}
              />
              <p className="text-xs text-muted-foreground">Enter skills separated by commas</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="years_experience_min">Minimum Years of Experience</Label>
                <Input
                  id="years_experience_min"
                  type="number"
                  min="0"
                  placeholder="e.g., 3"
                  {...register('years_experience_min')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_experience_max">Maximum Years of Experience</Label>
                <Input
                  id="years_experience_max"
                  type="number"
                  placeholder="e.g., 7"
                  {...register('years_experience_max')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education Requirements</Label>
              <Input
                id="education"
                placeholder="e.g., Bachelor's degree in Computer Science"
                {...register('education')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Benefits & Perks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits</Label>
              <Textarea
                id="benefits"
                placeholder="e.g., Health insurance, 401k, Remote work (comma-separated)"
                rows={3}
                {...register('benefits')}
              />
              <p className="text-xs text-muted-foreground">Enter benefits separated by commas</p>
            </div>
          </CardContent>
        </Card>

        {/* Application */}
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="application_url">Application URL</Label>
                <Input
                  id="application_url"
                  type="url"
                  placeholder="https://example.com/apply"
                  {...register('application_url')}
                />
                {errors.application_url && (
                  <p className="text-sm text-destructive">{errors.application_url.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="application_email">Application Email</Label>
                <Input
                  id="application_email"
                  type="email"
                  placeholder="jobs@example.com"
                  {...register('application_email')}
                />
                {errors.application_email && (
                  <p className="text-sm text-destructive">{errors.application_email.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Submit */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/admin/jobs/${jobId}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || updateJob.isPending}>
                {(isSubmitting || updateJob.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

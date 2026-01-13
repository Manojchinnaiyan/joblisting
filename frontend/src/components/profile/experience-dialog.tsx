'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateExperience, useUpdateExperience } from '@/hooks/use-experience'
import type { WorkExperience, EmploymentType } from '@/types/experience'

const experienceSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(255),
  company_name: z.string().min(1, 'Company name is required').max(255),
  location: z.string().max(255).optional(),
  employment_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']),
  is_remote: z.boolean(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  is_current: z.boolean(),
  description: z.string().max(2000).optional(),
}).refine(
  (data) => {
    if (!data.is_current && data.end_date) {
      return new Date(data.end_date) >= new Date(data.start_date)
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
)

type ExperienceFormData = z.infer<typeof experienceSchema>

interface ExperienceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  experience?: WorkExperience
}

const employmentTypes: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship' },
]

export function ExperienceDialog({ open, onOpenChange, experience }: ExperienceDialogProps) {
  const createExperience = useCreateExperience()
  const updateExperience = useUpdateExperience()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      is_current: false,
      is_remote: false,
      employment_type: 'FULL_TIME',
    },
  })

  const isCurrent = watch('is_current')

  useEffect(() => {
    if (!open) return // Don't reset when closing

    if (experience) {
      reset({
        title: experience.title,
        company_name: experience.company_name,
        location: experience.location || '',
        employment_type: experience.employment_type,
        is_remote: experience.is_remote ?? false,
        start_date: experience.start_date.split('T')[0],
        end_date: experience.end_date ? experience.end_date.split('T')[0] : '',
        is_current: experience.is_current,
        description: experience.description || '',
      })
    } else {
      reset({
        title: '',
        company_name: '',
        location: '',
        employment_type: 'FULL_TIME',
        is_remote: false,
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
      })
    }
  }, [experience, reset, open])

  useEffect(() => {
    if (isCurrent) {
      setValue('end_date', '')
    }
  }, [isCurrent, setValue])

  const onSubmit = async (data: ExperienceFormData) => {
    try {
      const payload = {
        ...data,
        end_date: data.is_current ? undefined : data.end_date || undefined,
      }

      if (experience) {
        await updateExperience.mutateAsync({ id: experience.id, data: payload })
      } else {
        await createExperience.mutateAsync(payload)
      }

      onOpenChange(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {experience ? 'Edit Work Experience' : 'Add Work Experience'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Senior Software Engineer"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company_name"
              placeholder="e.g. Google"
              {...register('company_name')}
            />
            {errors.company_name && (
              <p className="text-sm text-red-500">{errors.company_name.message}</p>
            )}
          </div>

          {/* Location and Employment Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. San Francisco, CA"
                {...register('location')}
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select
                value={watch('employment_type')}
                onValueChange={(value) => setValue('employment_type', value as EmploymentType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                disabled={isCurrent}
                {...register('end_date')}
              />
              {errors.end_date && (
                <p className="text-sm text-red-500">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Currently Working */}
          <div className="flex items-center gap-2">
            <Switch
              id="is_current"
              checked={watch('is_current')}
              onCheckedChange={(checked) => setValue('is_current', checked)}
            />
            <Label htmlFor="is_current" className="cursor-pointer">
              I currently work here
            </Label>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your responsibilities and achievements..."
              rows={6}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createExperience.isPending || updateExperience.isPending}
            >
              {createExperience.isPending || updateExperience.isPending
                ? 'Saving...'
                : experience
                ? 'Update'
                : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

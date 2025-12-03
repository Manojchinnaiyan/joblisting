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
import { useCreateEducation, useUpdateEducation } from '@/hooks/use-education'
import type { Education, DegreeType } from '@/types/education'

const educationSchema = z.object({
  institution_name: z.string().min(1, 'Institution is required').max(255),
  degree_type: z.enum(['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATE', 'DIPLOMA', 'OTHER']),
  field_of_study: z.string().min(1, 'Field of study is required').max(255),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  is_current: z.boolean().default(false),
  grade: z.string().max(50).optional(),
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

type EducationFormData = z.infer<typeof educationSchema>

interface EducationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  education?: Education
}

const degreeTypes: { value: DegreeType; label: string }[] = [
  { value: 'HIGH_SCHOOL', label: 'High School' },
  { value: 'ASSOCIATE', label: 'Associate Degree' },
  { value: 'BACHELOR', label: "Bachelor's Degree" },
  { value: 'MASTER', label: "Master's Degree" },
  { value: 'DOCTORATE', label: 'Doctorate' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'DIPLOMA', label: 'Diploma' },
  { value: 'OTHER', label: 'Other' },
]

export function EducationDialog({ open, onOpenChange, education }: EducationDialogProps) {
  const createEducation = useCreateEducation()
  const updateEducation = useUpdateEducation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      is_current: false,
      degree_type: 'BACHELOR',
    },
  })

  const isCurrent = watch('is_current')

  useEffect(() => {
    if (education) {
      reset({
        institution_name: education.institution_name,
        degree_type: education.degree_type,
        field_of_study: education.field_of_study || '',
        start_date: education.start_date.split('T')[0],
        end_date: education.end_date ? education.end_date.split('T')[0] : '',
        is_current: education.is_current,
        grade: education.grade || '',
        description: education.description || '',
      })
    } else {
      reset({
        institution_name: '',
        degree_type: 'BACHELOR',
        field_of_study: '',
        start_date: '',
        end_date: '',
        is_current: false,
        grade: '',
        description: '',
      })
    }
  }, [education, reset])

  useEffect(() => {
    if (isCurrent) {
      setValue('end_date', '')
    }
  }, [isCurrent, setValue])

  const onSubmit = async (data: EducationFormData) => {
    try {
      const payload = {
        ...data,
        end_date: data.is_current ? undefined : data.end_date || undefined,
      }

      if (education) {
        await updateEducation.mutateAsync({ id: education.id, data: payload })
      } else {
        await createEducation.mutateAsync(payload)
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
            {education ? 'Edit Education' : 'Add Education'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Institution */}
          <div className="space-y-2">
            <Label htmlFor="institution_name">
              School/University <span className="text-red-500">*</span>
            </Label>
            <Input
              id="institution_name"
              placeholder="e.g. Stanford University"
              {...register('institution_name')}
            />
            {errors.institution_name && (
              <p className="text-sm text-red-500">{errors.institution_name.message}</p>
            )}
          </div>

          {/* Degree and Field of Study */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree_type">
                Degree <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('degree_type')}
                onValueChange={(value) => setValue('degree_type', value as DegreeType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>
                <SelectContent>
                  {degreeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.degree_type && (
                <p className="text-sm text-red-500">{errors.degree_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_of_study">
                Field of Study <span className="text-red-500">*</span>
              </Label>
              <Input
                id="field_of_study"
                placeholder="e.g. Computer Science"
                {...register('field_of_study')}
              />
              {errors.field_of_study && (
                <p className="text-sm text-red-500">{errors.field_of_study.message}</p>
              )}
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
              <Label htmlFor="end_date">End Date (or expected)</Label>
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

          {/* Currently Studying */}
          <div className="flex items-center gap-2">
            <Switch
              id="is_current"
              checked={watch('is_current')}
              onCheckedChange={(checked) => setValue('is_current', checked)}
            />
            <Label htmlFor="is_current" className="cursor-pointer">
              I currently study here
            </Label>
          </div>

          {/* Grade */}
          <div className="space-y-2">
            <Label htmlFor="grade">Grade/GPA</Label>
            <Input
              id="grade"
              placeholder="e.g. 3.8 GPA, First Class Honours"
              {...register('grade')}
            />
            {errors.grade && (
              <p className="text-sm text-red-500">{errors.grade.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your activities, coursework, achievements..."
              rows={4}
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
              disabled={createEducation.isPending || updateEducation.isPending}
            >
              {createEducation.isPending || updateEducation.isPending
                ? 'Saving...'
                : education
                ? 'Update'
                : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

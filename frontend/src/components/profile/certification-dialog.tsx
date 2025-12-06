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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useCreateCertification, useUpdateCertification } from '@/hooks/use-certifications'
import type { Certification } from '@/types/certification'

const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required').max(255),
  issuing_organization: z.string().min(1, 'Issuing organization is required').max(255),
  issue_date: z.string().min(1, 'Issue date is required'),
  expiry_date: z.string().optional(),
  credential_id: z.string().max(255).optional(),
  credential_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  does_not_expire: z.boolean(),
}).refine(
  (data) => {
    if (!data.does_not_expire && data.expiry_date) {
      return new Date(data.expiry_date) >= new Date(data.issue_date)
    }
    return true
  },
  {
    message: 'Expiry date must be after issue date',
    path: ['expiry_date'],
  }
)

type CertificationFormData = z.infer<typeof certificationSchema>

interface CertificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certification?: Certification
}

export function CertificationDialog({ open, onOpenChange, certification }: CertificationDialogProps) {
  const createCertification = useCreateCertification()
  const updateCertification = useUpdateCertification()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      does_not_expire: false,
    },
  })

  const doesNotExpire = watch('does_not_expire')

  useEffect(() => {
    if (certification) {
      reset({
        name: certification.name,
        issuing_organization: certification.issuing_organization,
        issue_date: certification.issue_date.split('T')[0],
        expiry_date: certification.expiry_date ? certification.expiry_date.split('T')[0] : '',
        credential_id: certification.credential_id || '',
        credential_url: certification.credential_url || '',
        does_not_expire: !certification.expiry_date,
      })
    } else {
      reset({
        name: '',
        issuing_organization: '',
        issue_date: '',
        expiry_date: '',
        credential_id: '',
        credential_url: '',
        does_not_expire: false,
      })
    }
  }, [certification, reset])

  useEffect(() => {
    if (doesNotExpire) {
      setValue('expiry_date', '')
    }
  }, [doesNotExpire, setValue])

  const onSubmit = async (data: CertificationFormData) => {
    try {
      const payload = {
        name: data.name,
        issuing_organization: data.issuing_organization,
        issue_date: data.issue_date,
        expiry_date: data.does_not_expire ? undefined : data.expiry_date || undefined,
        no_expiry: data.does_not_expire,
        credential_id: data.credential_id || undefined,
        credential_url: data.credential_url || undefined,
      }

      if (certification) {
        await updateCertification.mutateAsync({ id: certification.id, data: payload })
      } else {
        await createCertification.mutateAsync(payload)
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
            {certification ? 'Edit Certification' : 'Add Certification'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Certification Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Certification Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. AWS Certified Solutions Architect"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Issuing Organization */}
          <div className="space-y-2">
            <Label htmlFor="issuing_organization">
              Issuing Organization <span className="text-red-500">*</span>
            </Label>
            <Input
              id="issuing_organization"
              placeholder="e.g. Amazon Web Services"
              {...register('issuing_organization')}
            />
            {errors.issuing_organization && (
              <p className="text-sm text-red-500">{errors.issuing_organization.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue_date">
                Issue Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="issue_date"
                type="date"
                {...register('issue_date')}
              />
              {errors.issue_date && (
                <p className="text-sm text-red-500">{errors.issue_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                disabled={doesNotExpire}
                {...register('expiry_date')}
              />
              {errors.expiry_date && (
                <p className="text-sm text-red-500">{errors.expiry_date.message}</p>
              )}
            </div>
          </div>

          {/* Does Not Expire */}
          <div className="flex items-center gap-2">
            <Switch
              id="does_not_expire"
              checked={watch('does_not_expire')}
              onCheckedChange={(checked) => setValue('does_not_expire', checked)}
            />
            <Label htmlFor="does_not_expire" className="cursor-pointer">
              This certification does not expire
            </Label>
          </div>

          {/* Credential Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credential_id">Credential ID</Label>
              <Input
                id="credential_id"
                placeholder="e.g. ABC123XYZ"
                {...register('credential_id')}
              />
              {errors.credential_id && (
                <p className="text-sm text-red-500">{errors.credential_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credential_url">Credential URL</Label>
              <Input
                id="credential_url"
                type="url"
                placeholder="https://..."
                {...register('credential_url')}
              />
              {errors.credential_url && (
                <p className="text-sm text-red-500">{errors.credential_url.message}</p>
              )}
            </div>
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
              disabled={createCertification.isPending || updateCertification.isPending}
            >
              {createCertification.isPending || updateCertification.isPending
                ? 'Saving...'
                : certification
                ? 'Update'
                : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

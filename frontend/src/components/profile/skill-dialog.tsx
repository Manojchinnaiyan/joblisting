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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateSkill, useUpdateSkill } from '@/hooks/use-skills'
import type { Skill, SkillLevel } from '@/types/skill'

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
})

type SkillFormData = z.infer<typeof skillSchema>

interface SkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill?: Skill
}

const skillLevels: { value: SkillLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
]

export function SkillDialog({ open, onOpenChange, skill }: SkillDialogProps) {
  const createSkill = useCreateSkill()
  const updateSkill = useUpdateSkill()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
  })

  useEffect(() => {
    if (skill) {
      reset({
        name: skill.name,
        level: skill.level,
      })
    } else {
      reset({
        name: '',
        level: undefined,
      })
    }
  }, [skill, reset])

  const onSubmit = async (data: SkillFormData) => {
    try {
      if (skill) {
        await updateSkill.mutateAsync({ id: skill.id, data })
      } else {
        await createSkill.mutateAsync(data)
      }

      onOpenChange(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {skill ? 'Edit Skill' : 'Add Skill'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Skill Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Skill Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. JavaScript, Python, Project Management"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Skill Level */}
          <div className="space-y-2">
            <Label htmlFor="level">Proficiency Level</Label>
            <Select
              value={watch('level')}
              onValueChange={(value) => setValue('level', value as SkillLevel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level (optional)" />
              </SelectTrigger>
              <SelectContent>
                {skillLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.level && (
              <p className="text-sm text-red-500">{errors.level.message}</p>
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
              disabled={createSkill.isPending || updateSkill.isPending}
            >
              {createSkill.isPending || updateSkill.isPending
                ? 'Saving...'
                : skill
                ? 'Update'
                : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

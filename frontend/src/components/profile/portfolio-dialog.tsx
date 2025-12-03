'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { useCreatePortfolioProject, useUpdatePortfolioProject } from '@/hooks/use-portfolio'
import type { PortfolioProject } from '@/types/portfolio'

const portfolioSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  project_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  github_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_featured: z.boolean().default(false),
})

type PortfolioFormData = z.infer<typeof portfolioSchema>

interface PortfolioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: PortfolioProject
}

export function PortfolioDialog({ open, onOpenChange, project }: PortfolioDialogProps) {
  const createProject = useCreatePortfolioProject()
  const updateProject = useUpdatePortfolioProject()
  const [technologies, setTechnologies] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      is_featured: false,
    },
  })

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description,
        project_url: project.project_url || '',
        github_url: project.source_code_url || '',
        is_featured: project.is_featured,
      })
      setTechnologies(project.technologies || [])
    } else {
      reset({
        title: '',
        description: '',
        project_url: '',
        github_url: '',
        is_featured: false,
      })
      setTechnologies([])
    }
  }, [project, reset])

  const addTechnology = () => {
    const tech = techInput.trim()
    if (tech && !technologies.includes(tech)) {
      setTechnologies([...technologies, tech])
      setTechInput('')
    }
  }

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTechnology()
    }
  }

  const onSubmit = async (data: PortfolioFormData) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        technologies: technologies,
        project_url: data.project_url || undefined,
        source_code_url: data.github_url || undefined,
        is_featured: data.is_featured,
      }

      if (project) {
        await updateProject.mutateAsync({ id: project.id, data: payload })
      } else {
        await createProject.mutateAsync(payload)
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
            {project ? 'Edit Project' : 'Add Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Project Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. E-commerce Platform"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your project, your role, and the impact..."
              rows={5}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Technologies */}
          <div className="space-y-2">
            <Label htmlFor="technologies">Technologies Used</Label>
            <div className="flex gap-2">
              <Input
                id="technologies"
                placeholder="e.g. React, Node.js, MongoDB"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button type="button" onClick={addTechnology} variant="outline">
                Add
              </Button>
            </div>
            {technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {technologies.map((tech) => (
                  <Badge key={tech} variant="secondary" className="gap-1">
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechnology(tech)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_url">Live Project URL</Label>
              <Input
                id="project_url"
                type="url"
                placeholder="https://..."
                {...register('project_url')}
              />
              {errors.project_url && (
                <p className="text-sm text-red-500">{errors.project_url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                type="url"
                placeholder="https://github.com/..."
                {...register('github_url')}
              />
              {errors.github_url && (
                <p className="text-sm text-red-500">{errors.github_url.message}</p>
              )}
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-center gap-2">
            <Switch
              id="is_featured"
              checked={watch('is_featured')}
              onCheckedChange={(checked) => setValue('is_featured', checked)}
            />
            <Label htmlFor="is_featured" className="cursor-pointer">
              Mark as featured project
            </Label>
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
              disabled={createProject.isPending || updateProject.isPending}
            >
              {createProject.isPending || updateProject.isPending
                ? 'Saving...'
                : project
                ? 'Update'
                : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Plus, Briefcase, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExperiences, useDeleteExperience } from '@/hooks/use-experience'
import { ExperienceDialog } from '@/components/profile/experience-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { format } from 'date-fns'
import type { WorkExperience } from '@/types/experience'

export default function ExperiencePage() {
  const { data: experiences = [], isLoading } = useExperiences()
  const deleteExperience = useDeleteExperience()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<WorkExperience | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleEdit = (experience: WorkExperience) => {
    setEditingExperience(experience)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingExperience(undefined)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteExperience.mutateAsync(id)
    setDeleteId(null)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingExperience(undefined)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Experience</h1>
          <p className="text-muted-foreground mt-1">
            Add your professional work history
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Experience
        </Button>
      </div>

      {/* Experience List */}
      {experiences.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No work experience added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your work experience to help employers understand your background
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Experience
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {experiences.map((experience) => (
            <Card key={experience.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{experience.title}</CardTitle>
                      <p className="text-muted-foreground mt-1">
                        {experience.company_name}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                        <span>
                          {format(new Date(experience.start_date), 'MMM yyyy')} -{' '}
                          {experience.is_current
                            ? 'Present'
                            : experience.end_date
                            ? format(new Date(experience.end_date), 'MMM yyyy')
                            : 'Present'}
                        </span>
                        {experience.employment_type && (
                          <>
                            <span>•</span>
                            <span>{experience.employment_type.replace('_', ' ')}</span>
                          </>
                        )}
                        {experience.location && (
                          <>
                            <span>•</span>
                            <span>{experience.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(experience)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(experience.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {experience.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {experience.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <ExperienceDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        experience={editingExperience}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Work Experience"
        description="Are you sure you want to delete this work experience? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        loading={deleteExperience.isPending}
      />
    </div>
  )
}

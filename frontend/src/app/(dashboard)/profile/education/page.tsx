'use client'

import { useState } from 'react'
import { Plus, GraduationCap, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEducation, useDeleteEducation } from '@/hooks/use-education'
import { EducationDialog } from '@/components/profile/education-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { format } from 'date-fns'
import type { Education } from '@/types/education'

export default function EducationPage() {
  const { data: education = [], isLoading } = useEducation()
  const deleteEducation = useDeleteEducation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEducation, setEditingEducation] = useState<Education | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleEdit = (edu: Education) => {
    setEditingEducation(edu)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingEducation(undefined)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteEducation.mutateAsync(id)
    setDeleteId(null)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingEducation(undefined)
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
          <h1 className="text-3xl font-bold">Education</h1>
          <p className="text-muted-foreground mt-1">
            Add your educational qualifications
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Education
        </Button>
      </div>

      {/* Education List */}
      {education.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No education added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your educational background to strengthen your profile
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Education
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {education.map((edu) => (
            <Card key={edu.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{edu.institution_name}</CardTitle>
                      <p className="text-muted-foreground mt-1">
                        {edu.degree_name || edu.degree_type} in {edu.field_of_study}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                        <span>
                          {format(new Date(edu.start_date), 'MMM yyyy')} -{' '}
                          {edu.is_current
                            ? 'Present'
                            : edu.end_date
                            ? format(new Date(edu.end_date), 'MMM yyyy')
                            : 'Present'}
                        </span>
                        {edu.grade && (
                          <>
                            <span>•</span>
                            <span>Grade: {edu.grade}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(edu)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(edu.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {edu.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {edu.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <EducationDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        education={editingEducation}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Education"
        description="Are you sure you want to delete this education entry? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        loading={deleteEducation.isPending}
      />
    </div>
  )
}

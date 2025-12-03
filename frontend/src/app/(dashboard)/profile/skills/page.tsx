'use client'

import { useState } from 'react'
import { Plus, Code, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSkills, useDeleteSkill } from '@/hooks/use-skills'
import { SkillDialog } from '@/components/profile/skill-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import type { Skill } from '@/types/skill'

export default function SkillsPage() {
  const { data: skills = [], isLoading } = useSkills()
  const deleteSkill = useDeleteSkill()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingSkill(undefined)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteSkill.mutateAsync(id)
    setDeleteId(null)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingSkill(undefined)
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
          <h1 className="text-3xl font-bold">Skills</h1>
          <p className="text-muted-foreground mt-1">
            Add your technical and professional skills
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      {/* Skills List */}
      {skills.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Code className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No skills added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your skills to help employers find you
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Skill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="group relative"
                >
                  <Badge
                    variant="secondary"
                    className="text-base py-2 px-4 pr-20"
                  >
                    {skill.name}
                    {skill.level && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {skill.level.toLowerCase().replace('_', ' ')}
                      </span>
                    )}
                  </Badge>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEdit(skill)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setDeleteId(skill.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <SkillDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        skill={editingSkill}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Skill"
        description="Are you sure you want to delete this skill? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        loading={deleteSkill.isPending}
      />
    </div>
  )
}

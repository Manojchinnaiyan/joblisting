'use client'

import { useState } from 'react'
import { Plus, FolderOpen, Edit, Trash2, ExternalLink, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePortfolio, useDeletePortfolioProject } from '@/hooks/use-portfolio'
import { PortfolioDialog } from '@/components/profile/portfolio-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import type { PortfolioProject } from '@/types/portfolio'

export default function PortfolioPage() {
  const { data: projects = [], isLoading } = usePortfolio()
  const deleteProject = useDeletePortfolioProject()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<PortfolioProject | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleEdit = (project: PortfolioProject) => {
    setEditingProject(project)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingProject(undefined)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteProject.mutateAsync(id)
    setDeleteId(null)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingProject(undefined)
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
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            Showcase your projects and work
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add projects to showcase your work to employers
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      {project.is_featured && (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Technologies */}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, index) => (
                      <Badge key={index} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Links */}
                <div className="flex flex-wrap gap-3">
                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View Project
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {project.source_code_url && (
                    <a
                      href={project.source_code_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View Code
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <PortfolioDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        project={editingProject}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        loading={deleteProject.isPending}
      />
    </div>
  )
}

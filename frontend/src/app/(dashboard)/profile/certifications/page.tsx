'use client'

import { useState } from 'react'
import { Plus, Award, Edit, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCertifications, useDeleteCertification } from '@/hooks/use-certifications'
import { CertificationDialog } from '@/components/profile/certification-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { format } from 'date-fns'
import type { Certification } from '@/types/certification'

export default function CertificationsPage() {
  const { data: certifications = [], isLoading } = useCertifications()
  const deleteCertification = useDeleteCertification()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCertification, setEditingCertification] = useState<Certification | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleEdit = (cert: Certification) => {
    setEditingCertification(cert)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingCertification(undefined)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteCertification.mutateAsync(id)
    setDeleteId(null)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingCertification(undefined)
  }

  const isExpired = (cert: Certification) => {
    if (!cert.expiry_date) return false
    return new Date(cert.expiry_date) < new Date()
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
          <h1 className="text-3xl font-bold">Certifications</h1>
          <p className="text-muted-foreground mt-1">
            Add your professional certifications and licenses
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Certification
        </Button>
      </div>

      {/* Certifications List */}
      {certifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No certifications added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add certifications to showcase your expertise
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Certification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <CardTitle className="text-xl">{cert.name}</CardTitle>
                        {isExpired(cert) && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1">
                        {cert.issuing_organization}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                        <span>
                          Issued {format(new Date(cert.issue_date), 'MMM yyyy')}
                        </span>
                        {cert.expiry_date && (
                          <>
                            <span>•</span>
                            <span>
                              {isExpired(cert) ? 'Expired' : 'Expires'}{' '}
                              {format(new Date(cert.expiry_date), 'MMM yyyy')}
                            </span>
                          </>
                        )}
                        {cert.credential_id && (
                          <>
                            <span>•</span>
                            <span>ID: {cert.credential_id}</span>
                          </>
                        )}
                      </div>
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                        >
                          View Credential
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(cert)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(cert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <CertificationDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        certification={editingCertification}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Certification"
        description="Are you sure you want to delete this certification? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        loading={deleteCertification.isPending}
      />
    </div>
  )
}

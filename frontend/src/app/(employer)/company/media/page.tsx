'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Image, Video, Edit, Trash2, Star, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  useCompanyMedia,
  useUploadMedia,
  useUpdateMedia,
  useDeleteMedia,
} from '@/hooks/employer/use-media'
import { CompanyMedia } from '@/lib/api/employer/media'

export default function CompanyMediaPage() {
  const { data: media, isLoading } = useCompanyMedia()
  const uploadMedia = useUploadMedia()
  const updateMedia = useUpdateMedia()
  const deleteMedia = useDeleteMedia()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMedia, setEditingMedia] = useState<CompanyMedia | null>(null)
  const [deletingMedia, setDeletingMedia] = useState<CompanyMedia | null>(null)

  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFeatured, setUploadFeatured] = useState(false)

  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setIsUploadDialogOpen(true)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) return

    await uploadMedia.mutateAsync({
      file: uploadFile,
      title: uploadTitle || undefined,
      description: uploadDescription || undefined,
      is_featured: uploadFeatured,
    })

    setIsUploadDialogOpen(false)
    setUploadFile(null)
    setUploadPreview(null)
    setUploadTitle('')
    setUploadDescription('')
    setUploadFeatured(false)
  }

  const openEditDialog = (item: CompanyMedia) => {
    setEditingMedia(item)
    setEditTitle(item.title || '')
    setEditDescription(item.description || '')
    setEditFeatured(item.is_featured)
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingMedia) return

    await updateMedia.mutateAsync({
      id: editingMedia.id,
      data: {
        title: editTitle || undefined,
        description: editDescription || undefined,
        is_featured: editFeatured,
      },
    })

    setIsEditDialogOpen(false)
    setEditingMedia(null)
  }

  const handleDelete = async () => {
    if (deletingMedia) {
      await deleteMedia.mutateAsync(deletingMedia.id)
      setDeletingMedia(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/company">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Media Gallery</h1>
            <p className="text-muted-foreground">Photos and videos of your company</p>
          </div>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,video/mp4"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={(media?.length ?? 0) >= 50}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>
      </div>

      {media?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No media uploaded</h3>
            <p className="mt-2 text-muted-foreground text-center">
              Upload photos and videos to showcase your workplace and culture.
            </p>
            <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Media
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {media?.length} of 50 media items used
          </p>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {media?.map((item) => (
              <Card key={item.id} className="overflow-hidden group relative">
                <div className="aspect-video relative">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="h-full w-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title || 'Company media'}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {item.is_featured && (
                    <Badge
                      className="absolute top-2 left-2 bg-yellow-500"
                    >
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                  {item.type === 'video' && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      <Video className="mr-1 h-3 w-3" />
                      Video
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeletingMedia(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {item.title && (
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Add details for your media file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {uploadPreview && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                {uploadFile?.type.startsWith('video/') ? (
                  <video
                    src={uploadPreview}
                    className="h-full w-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={uploadPreview}
                    alt="Upload preview"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="upload-title">Title</Label>
              <Input
                id="upload-title"
                placeholder="e.g., Our Office Space"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-description">Description</Label>
              <Textarea
                id="upload-description"
                placeholder="Describe this image or video..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="upload-featured">Featured</Label>
                <p className="text-sm text-muted-foreground">
                  Show this prominently on your company page
                </p>
              </div>
              <Switch
                id="upload-featured"
                checked={uploadFeatured}
                onCheckedChange={setUploadFeatured}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false)
                setUploadFile(null)
                setUploadPreview(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploadMedia.isPending}>
              {uploadMedia.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
            <DialogDescription>
              Update the details for this media item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingMedia && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                {editingMedia.type === 'video' ? (
                  <video
                    src={editingMedia.url}
                    className="h-full w-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={editingMedia.url}
                    alt={editingMedia.title || 'Media'}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Our Office Space"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe this image or video..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="edit-featured">Featured</Label>
                <p className="text-sm text-muted-foreground">
                  Show this prominently on your company page
                </p>
              </div>
              <Switch
                id="edit-featured"
                checked={editFeatured}
                onCheckedChange={setEditFeatured}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMedia.isPending}>
              {updateMedia.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingMedia}
        onOpenChange={() => setDeletingMedia(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deletingMedia?.type}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

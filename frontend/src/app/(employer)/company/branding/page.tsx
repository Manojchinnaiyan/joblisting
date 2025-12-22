'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, Trash2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  useMyCompany,
  useUploadLogo,
  useDeleteLogo,
  useUploadCover,
  useDeleteCover,
  useUpdateCompany,
} from '@/hooks/employer/use-company'

export default function CompanyBrandingPage() {
  const { data: company, isLoading } = useMyCompany()
  const uploadLogo = useUploadLogo()
  const deleteLogo = useDeleteLogo()
  const uploadCover = useUploadCover()
  const deleteCover = useDeleteCover()
  const updateCompany = useUpdateCompany()

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [brandColor, setBrandColor] = useState(company?.brand_color || '#000000')

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadLogo.mutateAsync(file)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadCover.mutateAsync(file)
    }
  }

  const handleColorChange = async (color: string) => {
    setBrandColor(color)
  }

  const handleColorSave = async () => {
    await updateCompany.mutateAsync({ brand_color: brandColor })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/company">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Company Branding</h1>
          <p className="text-muted-foreground">Customize your company&apos;s visual identity</p>
        </div>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>How your company appears to job seekers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg border overflow-hidden">
            {company?.cover_image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={company.cover_image_url}
                alt="Cover preview"
                className="h-32 w-full object-cover"
              />
            ) : (
              <div
                className="h-32 w-full"
                style={{
                  background: brandColor
                    ? `linear-gradient(135deg, ${brandColor}40, ${brandColor}20)`
                    : 'linear-gradient(135deg, #6366f140, #6366f120)',
                }}
              />
            )}
            <div className="absolute -bottom-8 left-4">
              {company?.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={company.logo_url}
                  alt="Logo preview"
                  className="h-16 w-16 rounded-lg border-4 border-background object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-4 border-background bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
          <div className="mt-12 pl-4">
            <h3 className="text-lg font-semibold">{company?.name}</h3>
            {company?.tagline && (
              <p className="text-sm text-muted-foreground">{company.tagline}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>
            Upload your company logo. Recommended size: 400x400 pixels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            {company?.logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={company.logo_url}
                alt="Current logo"
                className="h-24 w-24 rounded-lg border object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadLogo.isPending}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadLogo.isPending ? 'Uploading...' : 'Upload Logo'}
              </Button>
              {company?.logo_url && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Logo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove your company logo?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteLogo.mutate()}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <p className="text-sm text-muted-foreground">
                PNG, JPG or WebP. Max 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Image</CardTitle>
          <CardDescription>
            Upload a cover image for your company page. Recommended size: 1200x400 pixels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {company?.cover_image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={company.cover_image_url}
              alt="Current cover"
              className="h-40 w-full rounded-lg border object-cover"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No cover image</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleCoverUpload}
            />
            <Button
              variant="outline"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadCover.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadCover.isPending ? 'Uploading...' : 'Upload Cover'}
            </Button>
            {company?.cover_image_url && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Cover Image?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove your cover image?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteCover.mutate()}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            PNG, JPG or WebP. Max 10MB. Recommended aspect ratio: 3:1
          </p>
        </CardContent>
      </Card>

      {/* Brand Color */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Color</CardTitle>
          <CardDescription>
            Choose your primary brand color. This will be used as an accent color on your company page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="brand-color" className="sr-only">
              Brand Color
            </Label>
            <Input
              id="brand-color"
              type="color"
              value={brandColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-12 w-24 cursor-pointer p-1"
            />
            <Input
              value={brandColor}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#000000"
              className="w-32"
            />
            <div
              className="h-12 w-12 rounded-lg border"
              style={{ backgroundColor: brandColor }}
            />
          </div>
          <Button
            onClick={handleColorSave}
            disabled={updateCompany.isPending || brandColor === company?.brand_color}
          >
            {updateCompany.isPending ? 'Saving...' : 'Save Color'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { use } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Edit, Trash2, Briefcase, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useAdminCategory, useDeleteCategory } from '@/hooks/admin'
import { useRouter } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CategoryDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: category, isLoading } = useAdminCategory(id)
  const deleteCategory = useDeleteCategory()

  const handleDelete = async () => {
    await deleteCategory.mutateAsync(id)
    router.push('/admin/categories')
  }

  if (isLoading) {
    return <CategoryDetailSkeleton />
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FolderTree className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold mt-4">Category Not Found</h2>
        <p className="text-muted-foreground mt-2">The category you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Link>
        </Button>
      </div>
    )
  }

  const formatDate = (dateValue: string | undefined) => {
    if (!dateValue) return '-'
    try {
      const d = new Date(dateValue)
      if (isNaN(d.getTime())) return '-'
      return format(d, 'MMM d, yyyy HH:mm')
    } catch {
      return '-'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
            <Link href="/admin/categories">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {category.icon && <span className="text-3xl">{category.icon}</span>}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {category.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Category details and statistics
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/categories/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{category.name}&quot;? This action cannot be
                  undone. Jobs in this category will need to be reassigned.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs in Category</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{category.jobs_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              className={
                category.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }
            >
              {category.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Display Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{category.sort_order || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
          <CardDescription>Detailed information about this category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
              <p className="text-lg">{category.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Slug</h4>
              <code className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">{category.slug}</code>
            </div>
          </div>

          {category.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">{category.description}</p>
            </div>
          )}

          {category.parent_id && category.parent_name && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Parent Category</h4>
              <Link
                href={`/admin/categories/${category.parent_id}`}
                className="text-primary hover:underline"
              >
                {category.parent_name}
              </Link>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
              <p className="text-sm">{formatDate(category.created_at)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
              <p className="text-sm">{formatDate(category.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subcategories</CardTitle>
            <CardDescription>Categories under {category.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/admin/categories/${child.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {child.icon && <span>{child.icon}</span>}
                    <span className="font-medium">{child.name}</span>
                  </div>
                  <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">{child.jobs_count || 0} jobs</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CategoryDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div>
              <Skeleton className="h-4 w-12 mb-2" />
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

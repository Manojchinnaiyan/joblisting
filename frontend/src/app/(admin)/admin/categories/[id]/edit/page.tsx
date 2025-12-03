'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAdminCategory, useAdminCategories, useUpdateCategory } from '@/hooks/admin'

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  icon: z.string().optional(),
  parent_id: z.string().optional(),
  order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditCategoryPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const { data: category, isLoading } = useAdminCategory(id)
  const { data: categoriesData } = useAdminCategories({ limit: 100 })
  const updateCategory = useUpdateCategory()

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: '',
      parent_id: undefined,
      order: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        icon: category.icon || '',
        parent_id: category.parent_id || 'none',
        order: category.sort_order || 0,
        is_active: category.is_active,
      })
    }
  }, [category, form])

  const onSubmit = async (data: CategoryFormValues) => {
    // Convert "none" back to undefined for parent_id
    const submitData = {
      ...data,
      parent_id: data.parent_id === 'none' ? undefined : data.parent_id,
    }
    await updateCategory.mutateAsync({ id, data: submitData })
    router.push('/admin/categories')
  }

  // Filter out current category and its children from parent options
  const parentCategories = categoriesData?.categories?.filter(
    (c) => !c.parent_id && c.id !== id
  ) || []

  if (isLoading) {
    return <EditCategorySkeleton />
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">Category Not Found</h2>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
          <Link href="/admin/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Edit Category</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Update {category.name}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
              <CardDescription>Update category details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Development" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="software-development" {...field} />
                    </FormControl>
                    <FormDescription>URL-friendly identifier (lowercase, hyphens only)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jobs related to software development, programming, and engineering..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon (Emoji)</FormLabel>
                      <FormControl>
                        <Input placeholder="💻" {...field} />
                      </FormControl>
                      <FormDescription>Optional emoji icon for the category</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="None (Top-level)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None (Top-level)</SelectItem>
                          {parentCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Optional parent for subcategories</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Lower numbers appear first</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>Active categories are visible to users</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/categories">Cancel</Link>
            </Button>
            <Button type="submit" disabled={updateCategory.isPending}>
              {updateCategory.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

function EditCategorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-32 mt-1" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-12 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

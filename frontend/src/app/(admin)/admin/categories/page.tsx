'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FolderPlus,
  GripVertical,
  FolderTree,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { DataTable, getSelectColumn } from '@/components/admin/data-table'
import { useAdminCategories, useDeleteCategory } from '@/hooks/admin'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  parent_id?: string
  parent_name?: string
  parent?: {
    id: string
    name: string
  }
  jobs_count: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at?: string
  children?: Category[]
}

export default function CategoriesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data, isLoading, isFetching } = useAdminCategories({ page, limit })
  const showLoading = isLoading || (!data && isFetching)
  const deleteCategory = useDeleteCategory()

  // Client-side filtering for categories (typically small dataset)
  const allCategories = data?.categories || []
  const filteredCategories = search
    ? allCategories.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.description?.toLowerCase().includes(search.toLowerCase())
      )
    : allCategories

  const handleDelete = async () => {
    if (!selectedCategory) return
    await deleteCategory.mutateAsync(selectedCategory.id)
    setShowDeleteDialog(false)
    setSelectedCategory(null)
  }

  const columns: ColumnDef<Category>[] = [
    {
      id: 'order',
      header: '',
      cell: () => (
        <div className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original
        return (
          <div className="flex items-center gap-3">
            {category.icon && <span className="text-xl">{category.icon}</span>}
            <div>
              <Link
                href={`/admin/categories/${category.id}`}
                className="font-medium hover:underline"
              >
                {category.name}
              </Link>
              {category.parent && (
                <p className="text-sm text-muted-foreground">
                  Parent: {category.parent.name}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => (
        <code className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">{row.original.slug}</code>
      ),
    },
    {
      accessorKey: 'jobs_count',
      header: 'Jobs',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">{row.original.jobs_count} jobs</Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.is_active ? 'default' : 'secondary'}
          className={
            row.original.is_active
              ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
          }
        >
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'sort_order',
      header: 'Order',
      cell: ({ row }) => row.original.sort_order,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = row.original.created_at
        if (!date) return '-'
        try {
          const d = new Date(date)
          if (isNaN(d.getTime())) return '-'
          return format(d, 'MMM d, yyyy')
        } catch {
          return '-'
        }
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const category = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/categories/${category.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/categories/${category.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Category
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCategory(category)
                  setShowDeleteDialog(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const categories = filteredCategories
  const pagination = data
    ? { page, limit, total: filteredCategories.length, totalPages: Math.ceil(filteredCategories.length / limit) }
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Categories</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage job categories</p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      {showLoading ? (
        <DataTable
          columns={columns}
          data={[]}
          searchPlaceholder="Search categories..."
          searchValue={search}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          isLoading={true}
        />
      ) : allCategories.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border rounded-lg">
          <FolderTree className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Categories</h3>
          <p className="text-muted-foreground mt-2">Get started by creating your first category</p>
          <Button asChild className="mt-4">
            <Link href="/admin/categories/new">
              <FolderPlus className="mr-2 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          searchPlaceholder="Search categories..."
          searchValue={search}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          isLoading={false}
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedCategory?.name}&quot;? This action cannot be
              undone. Jobs in this category will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

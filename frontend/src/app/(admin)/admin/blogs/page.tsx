'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  X,
  RefreshCw,
} from 'lucide-react'
import { Blog, BlogStatus, adminBlogApi, blogApi, BlogCategory } from '@/lib/api/blog'
import { BlogStatusBadge } from '@/components/blog/BlogStatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { useToast } from '@/hooks/use-toast'

export default function AdminBlogsPage() {
  const { toast } = useToast()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const pageSize = 20

  const loadBlogs = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminBlogApi.getAdminBlogs({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: statusFilter !== 'all' ? (statusFilter as BlogStatus) : undefined,
        category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
      })
      setBlogs(response.blogs || [])
      setTotal(response.total)
      setTotalPages(response.total_pages)
    } catch (error) {
      console.error('Failed to load blogs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load blogs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, categoryFilter, toast])

  useEffect(() => {
    loadBlogs()
  }, [loadBlogs])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadBlogs()
    setIsRefreshing(false)
  }

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await blogApi.getCategories()
        setCategories(cats)
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    loadCategories()
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return

    setActionLoading(deleteId)
    try {
      await adminBlogApi.deleteBlog(deleteId)
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      })
      loadBlogs()
    } catch (error) {
      console.error('Failed to delete blog:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete blog',
        variant: 'destructive',
      })
    } finally {
      setDeleteId(null)
      setActionLoading(null)
    }
  }

  const handlePublish = async (id: string) => {
    setActionLoading(id)
    try {
      await adminBlogApi.publishBlog(id)
      toast({
        title: 'Success',
        description: 'Blog post published successfully',
      })
      loadBlogs()
    } catch (error) {
      console.error('Failed to publish blog:', error)
      toast({
        title: 'Error',
        description: 'Failed to publish blog',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnpublish = async (id: string) => {
    setActionLoading(id)
    try {
      await adminBlogApi.unpublishBlog(id)
      toast({
        title: 'Success',
        description: 'Blog post unpublished successfully',
      })
      loadBlogs()
    } catch (error) {
      console.error('Failed to unpublish blog:', error)
      toast({
        title: 'Error',
        description: 'Failed to unpublish blog',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Blog Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your blog posts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/blogs/new">
              <Plus className="h-4 w-4 mr-2" />
              New Blog Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search blogs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No blog posts yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Create your first blog post to get started
          </p>
          <Button asChild>
            <Link href="/admin/blogs/new">
              <Plus className="h-4 w-4 mr-2" />
              Create your first blog post
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {blog.title}
                    </TableCell>
                    <TableCell>
                      {blog.category?.name || (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <BlogStatusBadge status={blog.status} />
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-slate-400" />
                        {blog.view_count.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {blog.published_at
                        ? format(new Date(blog.published_at), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewBlog(blog)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" asChild title="Edit">
                          <Link href={`/admin/blogs/edit/${blog.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        {blog.status === 'published' && (
                          <Button variant="ghost" size="sm" asChild title="View Live">
                            <a
                              href={`/blogs/${blog.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {blog.status === 'draft' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublish(blog.id)}
                            disabled={actionLoading === blog.id}
                          >
                            {actionLoading === blog.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        ) : blog.status === 'published' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnpublish(blog.id)}
                            disabled={actionLoading === blog.id}
                          >
                            {actionLoading === blog.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 text-yellow-600" />
                            )}
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(blog.id)}
                          disabled={actionLoading === blog.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, total)} of {total} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      {previewBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPreviewBlog(null)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-lg shadow-xl overflow-hidden flex flex-col mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Preview
                </h2>
                <BlogStatusBadge status={previewBlog.status} />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/blogs/edit/${previewBlog.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                {previewBlog.status === 'published' && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/blogs/${previewBlog.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Live
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewBlog(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Featured Image */}
              {previewBlog.featured_image && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewBlog.featured_image}
                    alt={previewBlog.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-slate-500 dark:text-slate-400">
                {previewBlog.category && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    {previewBlog.category.name}
                  </span>
                )}
                {previewBlog.published_at && (
                  <span>
                    Published: {format(new Date(previewBlog.published_at), 'MMM d, yyyy')}
                  </span>
                )}
                <span>
                  Created: {format(new Date(previewBlog.created_at), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {previewBlog.view_count.toLocaleString()} views
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {previewBlog.title}
              </h1>

              {/* Excerpt */}
              {previewBlog.excerpt && (
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 italic border-l-4 border-blue-500 pl-4">
                  {previewBlog.excerpt}
                </p>
              )}

              {/* Tags */}
              {previewBlog.tags && previewBlog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {previewBlog.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Content */}
              <div
                className="prose prose-lg prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewBlog.content }}
              />

              {/* SEO Info */}
              {(previewBlog.meta_title || previewBlog.meta_description) && (
                <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    SEO Preview
                  </h3>
                  <div className="space-y-1">
                    <p className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                      {previewBlog.meta_title || previewBlog.title}
                    </p>
                    <p className="text-green-600 dark:text-green-400 text-sm">
                      /blogs/{previewBlog.slug}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {previewBlog.meta_description || previewBlog.excerpt || 'No description'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

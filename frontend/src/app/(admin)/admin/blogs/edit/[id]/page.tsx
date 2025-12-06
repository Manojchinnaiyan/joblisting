'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Blog, adminBlogApi } from '@/lib/api/blog'
import { BlogForm } from '@/components/admin/BlogForm'

export default function EditBlogPage() {
  const params = useParams()
  const id = params.id as string
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBlog() {
      try {
        const blogData = await adminBlogApi.getAdminBlog(id)
        setBlog(blogData)
      } catch (err) {
        console.error('Failed to load blog:', err)
        setError('Blog not found')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadBlog()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Blog not found
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          The blog post you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
          <Link href="/admin/blogs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Edit Blog Post</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Update your blog article</p>
        </div>
      </div>
      <BlogForm blog={blog} />
    </div>
  )
}

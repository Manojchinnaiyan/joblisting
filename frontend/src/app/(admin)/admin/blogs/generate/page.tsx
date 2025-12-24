'use client'

import { BlogGenerator } from '@/components/admin/BlogGenerator'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GenerateBlogPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/blogs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blogs
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Generate Blog with AI</h1>
        <p className="text-muted-foreground mt-2">
          Create SEO-optimized blog content from a URL or prompt using AI.
          The content will be human-readable and can be edited before publishing.
        </p>
      </div>

      {/* Blog Generator Component */}
      <BlogGenerator />
    </div>
  )
}

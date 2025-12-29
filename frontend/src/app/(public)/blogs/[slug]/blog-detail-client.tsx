'use client'

import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Eye, Calendar, User } from 'lucide-react'
import { Blog } from '@/lib/api/blog'
import { Button } from '@/components/ui/button'
import { ScrollNavigation } from '@/components/shared/scroll-navigation'

interface BlogDetailClientProps {
  blog: Blog
}

export function BlogDetailClient({ blog }: BlogDetailClientProps) {
  const publishedDate = blog.published_at
    ? format(new Date(blog.published_at), 'MMMM d, yyyy')
    : null

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Button */}
      <div className="mb-8">
        <Button variant="ghost" asChild>
          <Link href="/blogs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </Button>
      </div>

      {/* Featured Image */}
      {blog.featured_image && (
        <div className="relative w-full h-[400px] rounded-xl overflow-hidden mb-8">
          <Image
            src={blog.featured_image}
            alt={blog.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Category Badge */}
      {blog.category && (
        <span className="inline-block text-sm font-medium text-primary mb-4">
          {blog.category.name}
        </span>
      )}

      {/* Title */}
      <h1 className="text-4xl font-bold text-foreground mb-6">{blog.title}</h1>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8 pb-8 border-b">
        {blog.author && (
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            By {blog.author.first_name} {blog.author.last_name}
          </span>
        )}
        {publishedDate && (
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {publishedDate}
          </span>
        )}
        <span className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          {blog.view_count.toLocaleString()} views
        </span>
      </div>

      {/* Excerpt */}
      {blog.excerpt && (
        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
          {blog.excerpt}
        </p>
      )}

      {/* Content */}
      <div
        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scroll Navigation */}
      <ScrollNavigation />
    </article>
  )
}

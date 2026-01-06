import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Eye } from 'lucide-react'
import { Blog } from '@/lib/api/blog'

interface BlogCardProps {
  blog: Blog
}

export function BlogCard({ blog }: BlogCardProps) {
  const publishedDate = blog.published_at
    ? format(new Date(blog.published_at), 'MMMM d, yyyy')
    : null

  return (
    <Link href={`/blogs/${blog.slug}`} target="_blank" rel="noopener noreferrer">
      <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card">
        {/* Featured Image */}
        {blog.featured_image ? (
          <div className="relative w-full h-48">
            <Image
              src={blog.featured_image}
              alt={blog.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
            <span className="text-4xl text-primary/50">
              {blog.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Category Badge */}
          {blog.category && (
            <span className="inline-block text-sm text-primary font-medium mb-2">
              {blog.category.name}
            </span>
          )}

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
            {blog.title}
          </h2>

          {/* Excerpt */}
          {blog.excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-3">{blog.excerpt}</p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {publishedDate && <span>{publishedDate}</span>}
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {blog.view_count.toLocaleString()} views
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

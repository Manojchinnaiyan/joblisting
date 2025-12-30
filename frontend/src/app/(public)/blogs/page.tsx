import { Metadata } from 'next'
import { Suspense } from 'react'
import { BlogsPageClient } from './blogs-page-client'
import { BlogCategory, BlogListResponse } from '@/lib/api/blog'
import { Loader2 } from 'lucide-react'

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://jobsworld.in/api/v1'

export const metadata: Metadata = {
  title: 'Blog - Career Advice, Job Search Tips & Industry Insights',
  description: 'Latest articles and insights on careers, job searching, resume tips, interview preparation, and professional development. Expert advice to help you succeed.',
  keywords: [
    'career advice',
    'job search tips',
    'resume tips',
    'interview preparation',
    'career development',
    'professional growth',
    'workplace advice',
    'industry insights',
  ],
  openGraph: {
    title: 'Blog - Career Advice, Job Search Tips & Industry Insights',
    description: 'Latest articles and insights on careers, job searching, and professional development.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://jobsworld.in/blogs',
  },
}

async function getInitialBlogs(): Promise<BlogListResponse | null> {
  try {
    const response = await fetch(`${API_URL}/blogs?page=1&page_size=12`, {
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch initial blogs:', response.status)
      return null
    }

    const data = await response.json()
    // API returns { blogs, page, page_size, total, total_pages } directly at root level
    return data as BlogListResponse
  } catch (error) {
    console.error('Error fetching initial blogs:', error)
    return null
  }
}

async function getCategories(): Promise<BlogCategory[]> {
  try {
    const response = await fetch(`${API_URL}/blog-categories`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status)
      return []
    }

    const data = await response.json()
    // API returns array of categories directly at root level
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

function BlogsPageFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="h-10 w-32 bg-muted animate-pulse rounded mx-auto mb-4" />
        <div className="h-6 w-96 bg-muted animate-pulse rounded mx-auto" />
      </div>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}

export default async function BlogsPage() {
  // Fetch blogs and categories in parallel for SSR
  const [initialData, categories] = await Promise.all([
    getInitialBlogs(),
    getCategories(),
  ])

  return (
    <Suspense fallback={<BlogsPageFallback />}>
      <BlogsPageClient initialData={initialData} initialCategories={categories} />
    </Suspense>
  )
}

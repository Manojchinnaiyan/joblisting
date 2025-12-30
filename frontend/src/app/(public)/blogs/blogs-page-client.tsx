'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Blog, BlogCategory, blogApi, BlogListResponse } from '@/lib/api/blog'
import { BlogCard } from '@/components/blog/BlogCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BlogsPageClientProps {
  initialData: BlogListResponse | null
  initialCategories: BlogCategory[]
}

export function BlogsPageClient({ initialData, initialCategories }: BlogsPageClientProps) {
  const [blogs, setBlogs] = useState<Blog[]>(initialData?.blogs || [])
  // Categories are now passed from server - no client-side fetch needed
  const categories = initialCategories
  const [loading, setLoading] = useState(!initialData)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialData?.total_pages || 0)
  const [hasSearched, setHasSearched] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const pageSize = 12

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
      if (searchInput) {
        setHasSearched(true)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchInput])

  const loadBlogs = useCallback(async () => {
    setLoading(true)
    try {
      const response = await blogApi.getBlogs({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
      })
      setBlogs(response.blogs || [])
      setTotalPages(response.total_pages)
    } catch (error) {
      console.error('Failed to load blogs:', error)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, categoryFilter])

  useEffect(() => {
    // Only fetch if user has searched/filtered or changed page
    if (hasSearched || categoryFilter !== 'all' || page > 1 || !initialData) {
      loadBlogs()
    }
  }, [loadBlogs, hasSearched, categoryFilter, page, initialData])

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setPage(1)
    setHasSearched(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Latest articles and insights on careers, job searching, and professional development
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
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

      {/* Blog Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground mb-2">
            No blog posts found
          </h3>
          <p className="text-muted-foreground">
            {searchInput || categoryFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Check back soon for new articles'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

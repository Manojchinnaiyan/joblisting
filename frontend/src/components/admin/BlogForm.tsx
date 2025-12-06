'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { RichTextEditor } from './RichTextEditor'
import { blogSchema, BlogFormData } from '@/lib/validations/blog'
import {
  Blog,
  BlogCategory,
  BlogTag,
  blogApi,
  adminBlogApi,
} from '@/lib/api/blog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlogFormProps {
  blog?: Blog
  onSuccess?: () => void
}

export function BlogForm({ blog, onSuccess }: BlogFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState(blog?.content || '')
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(
    blog?.tags?.map((t) => t.id) || []
  )
  const [loading, setLoading] = useState(false)
  const [showSeoFields, setShowSeoFields] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: blog?.title || '',
      excerpt: blog?.excerpt || '',
      content: blog?.content || '',
      featured_image: blog?.featured_image || '',
      category_id: blog?.category_id || '',
      tag_ids: blog?.tags?.map((t) => t.id) || [],
      meta_title: blog?.meta_title || '',
      meta_description: blog?.meta_description || '',
      meta_keywords: blog?.meta_keywords || '',
      status: blog?.status || 'draft',
    },
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          blogApi.getCategories(),
          blogApi.getTags(),
        ])
        setCategories(categoriesData)
        setTags(tagsData)
      } catch (error) {
        console.error('Failed to load categories/tags:', error)
      }
    }
    loadData()
  }, [])

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
      setValue('tag_ids', newTags)
      return newTags
    })
  }

  const onSubmit = async (data: BlogFormData) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        content,
        tag_ids: selectedTags,
        category_id: data.category_id || undefined,
        featured_image: data.featured_image || undefined,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        meta_keywords: data.meta_keywords || undefined,
      }

      if (blog) {
        await adminBlogApi.updateBlog(blog.id, payload)
        toast({
          title: 'Success',
          description: 'Blog post updated successfully',
        })
      } else {
        await adminBlogApi.createBlog(payload)
        toast({
          title: 'Success',
          description: 'Blog post created successfully',
        })
      }

      onSuccess?.()
      router.push('/admin/blogs')
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast({
        title: 'Error',
        description: err.message || 'Failed to save blog post',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Enter blog title"
          className={cn(errors.title && 'border-destructive')}
        />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title.message}</p>
        )}
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          {...register('excerpt')}
          placeholder="Brief summary of the blog post"
          rows={3}
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label>Content *</Label>
        <RichTextEditor
          content={content}
          onChange={(newContent) => {
            setContent(newContent)
            setValue('content', newContent)
          }}
        />
        {errors.content && (
          <p className="text-destructive text-sm">{errors.content.message}</p>
        )}
      </div>

      {/* Featured Image */}
      <div className="space-y-2">
        <Label htmlFor="featured_image">Featured Image URL</Label>
        <Input
          id="featured_image"
          {...register('featured_image')}
          placeholder="https://example.com/image.jpg"
        />
        {errors.featured_image && (
          <p className="text-destructive text-sm">{errors.featured_image.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={watch('category_id') || 'none'}
          onValueChange={(value) => setValue('category_id', value === 'none' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Category</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagToggle(tag.id)}
              className={cn(
                'px-3 py-1 rounded-full text-sm transition-colors',
                selectedTags.includes(tag.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {tag.name}
            </button>
          ))}
        </div>
        {tags.length === 0 && (
          <p className="text-muted-foreground text-sm">No tags available</p>
        )}
      </div>

      {/* SEO Fields (Collapsible) */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
        <button
          type="button"
          onClick={() => setShowSeoFields(!showSeoFields)}
          className="w-full px-4 py-3 flex items-center justify-between text-left font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          SEO Settings
          {showSeoFields ? (
            <ChevronUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          )}
        </button>
        {showSeoFields && (
          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                {...register('meta_title')}
                placeholder="SEO title (defaults to blog title)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                {...register('meta_description')}
                placeholder="SEO description"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input
                id="meta_keywords"
                {...register('meta_keywords')}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label>Status *</Label>
        <Select
          value={watch('status')}
          onValueChange={(value) =>
            setValue('status', value as 'draft' | 'published' | 'archived')
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {blog ? 'Update Blog' : 'Create Blog'}
        </Button>
        {blog && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/blogs')}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

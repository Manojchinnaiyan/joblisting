import apiClient from './client'

// Types
export type BlogStatus = 'draft' | 'published' | 'archived'

export interface BlogAuthor {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Blog {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  author_id: string
  author?: BlogAuthor
  category_id?: string
  category?: BlogCategory
  tags?: BlogTag[]
  status: BlogStatus
  published_at?: string
  view_count: number
  created_at: string
  updated_at: string
}

export interface BlogListResponse {
  blogs: Blog[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface BlogFilters {
  page?: number
  page_size?: number
  status?: BlogStatus
  category_id?: string
  search?: string
  sort_by?: string
  sort_order?: 'ASC' | 'DESC'
}

export interface CreateBlogRequest {
  title: string
  excerpt?: string
  content: string
  featured_image?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  category_id?: string
  tag_ids?: string[]
  status: BlogStatus
}

export interface UpdateBlogRequest {
  title?: string
  excerpt?: string
  content?: string
  featured_image?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  category_id?: string
  tag_ids?: string[]
  status?: BlogStatus
}

export interface CreateCategoryRequest {
  name: string
  description?: string
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
}

export interface CreateTagRequest {
  name: string
}

// Public API functions
export const blogApi = {
  getBlogs: async (filters?: BlogFilters): Promise<BlogListResponse> => {
    const params = new URLSearchParams()

    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.page_size) params.append('page_size', filters.page_size.toString())
    if (filters?.category_id) params.append('category_id', filters.category_id)
    if (filters?.search) params.append('search', filters.search)

    const response = await apiClient.get<BlogListResponse>(`/blogs?${params.toString()}`)
    return response.data
  },

  getBlog: async (id: string): Promise<Blog> => {
    const response = await apiClient.get<Blog>(`/blogs/${id}`)
    return response.data
  },

  getBlogBySlug: async (slug: string): Promise<Blog> => {
    const response = await apiClient.get<Blog>(`/blogs/slug/${slug}`)
    return response.data
  },

  getCategories: async (): Promise<BlogCategory[]> => {
    const response = await apiClient.get<BlogCategory[]>('/blog-categories')
    return response.data
  },

  getTags: async (): Promise<BlogTag[]> => {
    const response = await apiClient.get<BlogTag[]>('/blog-tags')
    return response.data
  },
}

// Admin API functions
export const adminBlogApi = {
  createBlog: async (data: CreateBlogRequest): Promise<Blog> => {
    const response = await apiClient.post<Blog>('/admin/blogs', data)
    return response.data
  },

  getAdminBlogs: async (filters?: BlogFilters): Promise<BlogListResponse> => {
    const params = new URLSearchParams()

    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.page_size) params.append('page_size', filters.page_size.toString())
    if (filters?.status) params.append('status', filters.status)
    if (filters?.category_id) params.append('category_id', filters.category_id)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.sort_by) params.append('sort_by', filters.sort_by)
    if (filters?.sort_order) params.append('sort_order', filters.sort_order)

    const response = await apiClient.get<BlogListResponse>(
      `/admin/blogs?${params.toString()}`
    )
    return response.data
  },

  getAdminBlog: async (id: string): Promise<Blog> => {
    const response = await apiClient.get<Blog>(`/admin/blogs/${id}`)
    return response.data
  },

  updateBlog: async (id: string, data: UpdateBlogRequest): Promise<Blog> => {
    const response = await apiClient.put<Blog>(`/admin/blogs/${id}`, data)
    return response.data
  },

  deleteBlog: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/blogs/${id}`)
  },

  publishBlog: async (id: string): Promise<Blog> => {
    const response = await apiClient.post<Blog>(`/admin/blogs/${id}/publish`)
    return response.data
  },

  unpublishBlog: async (id: string): Promise<Blog> => {
    const response = await apiClient.post<Blog>(`/admin/blogs/${id}/unpublish`)
    return response.data
  },

  // Category management
  createCategory: async (data: CreateCategoryRequest): Promise<BlogCategory> => {
    const response = await apiClient.post<BlogCategory>('/admin/blog-categories', data)
    return response.data
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<BlogCategory> => {
    const response = await apiClient.put<BlogCategory>(`/admin/blog-categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/blog-categories/${id}`)
  },

  // Tag management
  createTag: async (data: CreateTagRequest): Promise<BlogTag> => {
    const response = await apiClient.post<BlogTag>('/admin/blog-tags', data)
    return response.data
  },

  deleteTag: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/blog-tags/${id}`)
  },
}

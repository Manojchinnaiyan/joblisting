import { z } from 'zod'

export const blogSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  featured_image: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  category_id: z.string().uuid().optional().or(z.literal('')),
  tag_ids: z.array(z.string().uuid()).optional(),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
  meta_keywords: z.string().max(500).optional(),
  status: z.enum(['draft', 'published', 'archived']),
})

export type BlogFormData = z.infer<typeof blogSchema>

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

export const tagSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
})

export type TagFormData = z.infer<typeof tagSchema>

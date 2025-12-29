import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { blogApi } from '@/lib/api/blog'
import { BlogDetailClient } from './blog-detail-client'
import { BlogStructuredData } from '@/components/seo/blog-structured-data'
import { Button } from '@/components/ui/button'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobsworld.in'

async function getBlog(slug: string) {
  try {
    return await blogApi.getBlogBySlug(slug)
  } catch (error) {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const blog = await getBlog(slug)

  if (!blog) {
    return {
      title: 'Blog Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    }
  }

  const title = blog.meta_title || blog.title
  const description = blog.meta_description || blog.excerpt || blog.title

  return {
    title,
    description,
    keywords: blog.meta_keywords?.split(',').map(k => k.trim()) || blog.tags?.map(t => t.name),
    authors: blog.author
      ? [{ name: `${blog.author.first_name} ${blog.author.last_name}` }]
      : undefined,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${BASE_URL}/blogs/${slug}`,
      publishedTime: blog.published_at || blog.created_at,
      modifiedTime: blog.updated_at,
      authors: blog.author
        ? [`${blog.author.first_name} ${blog.author.last_name}`]
        : undefined,
      section: blog.category?.name || 'Career Advice',
      tags: blog.tags?.map(t => t.name),
      images: blog.featured_image
        ? [
            {
              url: blog.featured_image,
              width: 1200,
              height: 630,
              alt: blog.title,
            },
          ]
        : [
            {
              url: `${BASE_URL}/og-image.png`,
              width: 1200,
              height: 630,
              alt: 'JobsWorld Blog',
            },
          ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: blog.featured_image ? [blog.featured_image] : [`${BASE_URL}/og-image.png`],
    },
    alternates: {
      canonical: `${BASE_URL}/blogs/${slug}`,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const blog = await getBlog(slug)

  if (!blog) {
    notFound()
  }

  return (
    <>
      <BlogStructuredData blog={blog} />
      <BlogDetailClient blog={blog} />
    </>
  )
}

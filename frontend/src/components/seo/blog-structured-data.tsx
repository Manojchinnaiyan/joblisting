import Script from 'next/script'
import { Blog } from '@/lib/api/blog'

interface BlogStructuredDataProps {
  blog: Blog
}

export function BlogStructuredData({ blog }: BlogStructuredDataProps) {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobsworld.in'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt || blog.meta_description || blog.title,
    image: blog.featured_image || `${BASE_URL}/og-image.png`,
    datePublished: blog.published_at || blog.created_at,
    dateModified: blog.updated_at,
    author: blog.author
      ? {
          '@type': 'Person',
          name: `${blog.author.first_name} ${blog.author.last_name}`,
        }
      : {
          '@type': 'Organization',
          name: 'JobsWorld',
        },
    publisher: {
      '@type': 'Organization',
      name: 'JobsWorld',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blogs/${blog.slug}`,
    },
    url: `${BASE_URL}/blogs/${blog.slug}`,
    keywords: blog.meta_keywords || blog.tags?.map(tag => tag.name).join(', '),
    articleSection: blog.category?.name || 'Career Advice',
    wordCount: blog.content ? blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length : undefined,
  }

  // Add BreadcrumbList
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${BASE_URL}/blogs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: blog.title,
        item: `${BASE_URL}/blogs/${blog.slug}`,
      },
    ],
  }

  return (
    <>
      <Script
        id="blog-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script
        id="blog-breadcrumb-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  )
}

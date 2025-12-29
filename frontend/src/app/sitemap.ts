import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobsworld.in'
// Use production API URL for sitemap generation
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jobsworld.in/api/v1'

interface SitemapJob {
  slug: string
  updated_at: string
}

interface SitemapCompany {
  slug: string
  updated_at: string
}

interface SitemapCategory {
  slug: string
  name: string
}

interface SitemapBlog {
  slug: string
  updated_at: string
}

async function getJobsForSitemap(): Promise<SitemapJob[]> {
  try {
    const response = await fetch(`${API_URL}/jobs/sitemap`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.data?.jobs || []
  } catch (error) {
    console.error('Failed to fetch jobs for sitemap:', error)
    return []
  }
}

async function getCompaniesForSitemap(): Promise<SitemapCompany[]> {
  try {
    const response = await fetch(`${API_URL}/companies/sitemap`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.data?.companies || []
  } catch (error) {
    console.error('Failed to fetch companies for sitemap:', error)
    return []
  }
}

async function getCategoriesForSitemap(): Promise<SitemapCategory[]> {
  try {
    const response = await fetch(`${API_URL}/jobs/categories`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.data?.categories || []
  } catch (error) {
    console.error('Failed to fetch categories for sitemap:', error)
    return []
  }
}

async function getBlogsForSitemap(): Promise<SitemapBlog[]> {
  try {
    const response = await fetch(`${API_URL}/blogs?page=1&page_size=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.data?.blogs?.map((blog: { slug: string; updated_at: string }) => ({
      slug: blog.slug,
      updated_at: blog.updated_at,
    })) || []
  } catch (error) {
    console.error('Failed to fetch blogs for sitemap:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, companies, categories, blogs] = await Promise.all([
    getJobsForSitemap(),
    getCompaniesForSitemap(),
    getCategoriesForSitemap(),
    getBlogsForSitemap(),
  ])

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/companies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ]

  // Job pages
  const jobPages: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${BASE_URL}/jobs/${job.slug}`,
    lastModified: new Date(job.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Company pages
  const companyPages: MetadataRoute.Sitemap = companies.map((company) => ({
    url: `${BASE_URL}/companies/${company.slug}`,
    lastModified: new Date(company.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/jobs?category=${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Blog pages
  const blogPages: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${BASE_URL}/blogs/${blog.slug}`,
    lastModified: new Date(blog.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...jobPages, ...companyPages, ...categoryPages, ...blogPages]
}

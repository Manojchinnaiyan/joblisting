'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Code,
  Palette,
  BarChart,
  Megaphone,
  Users,
  Briefcase,
  DollarSign,
  Settings
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Container } from '@/components/layout/container'
import { jobsApi } from '@/lib/api/jobs'
import { toast } from 'sonner'

const iconMap: Record<string, any> = {
  engineering: Code,
  design: Palette,
  'data-analytics': BarChart,
  marketing: Megaphone,
  hr: Users,
  sales: DollarSign,
  product: Briefcase,
  operations: Settings,
}

interface Category {
  id: string
  name: string
  slug: string
  count: number
}

interface JobCategoriesProps {
  initialCategories?: Category[]
}

export function JobCategories({ initialCategories }: JobCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || [])
  const [isLoading, setIsLoading] = useState(!initialCategories || initialCategories.length === 0)

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (initialCategories && initialCategories.length > 0) {
      return
    }

    const fetchCategories = async () => {
      try {
        const data = await jobsApi.getCategories()
        setCategories(data)
      } catch (error) {
        toast.error('Failed to load job categories')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [initialCategories])

  // If no categories after loading, don't render the section at all
  // This prevents initial flash - we start with loading state
  if (!isLoading && categories.length === 0) {
    return null
  }

  return (
    <section className="py-10 md:py-14">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Browse by Category</h2>
          <p className="text-muted-foreground mt-2">
            Find the perfect role in your field of expertise
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[140px] bg-muted animate-pulse rounded-lg" />
            ))
          ) : (
            categories.slice(0, 8).map((category) => {
              const Icon = iconMap[category.slug] || Briefcase
              return (
                <Link key={category.slug} href={`/jobs?category=${category.slug}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.count} jobs
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      </Container>
    </section>
  )
}

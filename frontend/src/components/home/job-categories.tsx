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

export function JobCategories() {
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; count: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
  }, [])

  // Always render the section with fixed height to prevent CLS
  // Hide content visually when no categories but maintain layout
  const showSkeleton = isLoading
  const isEmpty = !isLoading && categories.length === 0

  return (
    <section
      className="py-16 md:py-24"
      style={{
        minHeight: isEmpty ? 0 : '500px',
        transition: 'min-height 0.3s ease-out'
      }}
      aria-hidden={isEmpty}
    >
      {!isEmpty && (
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Browse by Category</h2>
            <p className="text-muted-foreground mt-2">
              Find the perfect role in your field of expertise
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {showSkeleton ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="min-h-[140px] bg-muted animate-pulse rounded-lg" />
              ))
            ) : (
              categories.slice(0, 8).map((category) => {
                const Icon = iconMap[category.slug] || Briefcase
                return (
                  <Link key={category.slug} href={`/jobs?category=${category.slug}`}>
                    <Card className="hover:shadow-md transition-shadow h-full min-h-[140px]">
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
      )}
    </section>
  )
}

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
  Settings,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import { jobsApi } from '@/lib/api/jobs'

const iconMap: Record<string, any> = {
  engineering: Code,
  technology: Code,
  design: Palette,
  'data-analytics': BarChart,
  marketing: Megaphone,
  hr: Users,
  'human-resources': Users,
  sales: DollarSign,
  finance: DollarSign,
  product: Briefcase,
  operations: Settings,
  'customer-support': Users,
}

const colorMap: Record<number, string> = {
  0: 'bg-lime-400 text-gray-900 hover:bg-lime-300',
  1: 'bg-purple-600 text-white hover:bg-purple-500',
  2: 'bg-white text-gray-900 hover:bg-gray-100',
  3: 'bg-orange-400 text-white hover:bg-orange-300',
  4: 'bg-pink-500 text-white hover:bg-pink-400',
  5: 'bg-cyan-400 text-gray-900 hover:bg-cyan-300',
  6: 'bg-gray-800 text-white hover:bg-gray-700',
  7: 'bg-yellow-400 text-gray-900 hover:bg-yellow-300',
}

export function CategoriesBento() {
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; count: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await jobsApi.getCategories()
        setCategories(data)
      } catch (error) {
        // Silently fail
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (isLoading || categories.length === 0) {
    return null
  }

  return (
    <section className="bg-[#0f0f1a] text-white py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-lime-400" />
              <span className="text-lime-400 text-sm font-medium">Explore Categories</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Browse by
              <span className="text-lime-400"> Category</span>
            </h2>
          </div>
          <Link
            href="/jobs"
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-lime-400 transition-colors"
          >
            View All Jobs
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((category, index) => {
            const Icon = iconMap[category.slug] || Briefcase
            const colorClass = colorMap[index % 8]

            return (
              <Link
                key={category.slug}
                href={`/jobs?category=${category.slug}`}
                className={`group relative rounded-3xl p-6 transition-all duration-300 transform hover:scale-[1.02] ${colorClass} ${
                  index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                }`}
              >
                <div className={`${index === 0 ? 'md:h-full md:flex md:flex-col md:justify-between' : ''}`}>
                  <div className={`p-3 rounded-2xl bg-black/10 w-fit ${index === 0 ? 'md:p-4' : ''}`}>
                    <Icon className={`h-6 w-6 ${index === 0 ? 'md:h-8 md:w-8' : ''}`} />
                  </div>
                  <div className={`mt-4 ${index === 0 ? 'md:mt-auto' : ''}`}>
                    <h3 className={`font-bold ${index === 0 ? 'text-xl md:text-2xl' : 'text-lg'}`}>
                      {category.name}
                    </h3>
                    <p className={`mt-1 opacity-80 ${index === 0 ? 'text-base' : 'text-sm'}`}>
                      {category.count} jobs
                    </p>
                  </div>
                  <ArrowUpRight className={`absolute top-6 right-6 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ${index === 0 ? 'md:h-6 md:w-6' : ''}`} />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 md:hidden">
          <Link
            href="/jobs"
            className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-lime-400 text-gray-900 rounded-full font-medium"
          >
            View All Jobs
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

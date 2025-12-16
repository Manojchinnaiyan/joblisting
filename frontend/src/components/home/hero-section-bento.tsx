'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Sparkles, TrendingUp, Users, Briefcase, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function HeroSectionBento() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.append('q', searchQuery)
    if (location) params.append('location', location)
    router.push(`/jobs?${params.toString()}`)
  }

  return (
    <section className="relative min-h-screen bg-[#0f0f1a] text-white overflow-hidden py-8 px-4 md:px-8">
      {/* Background decorative elements */}
      <div className="absolute top-20 right-10 text-lime-400 animate-pulse">
        <Star className="h-8 w-8 fill-current" />
      </div>
      <div className="absolute bottom-40 left-10 text-purple-400 animate-pulse delay-300">
        <Sparkles className="h-6 w-6" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">

          {/* Main Hero Card - Large */}
          <div className="md:col-span-4 lg:col-span-4 row-span-2 bg-gradient-to-br from-lime-400 to-lime-300 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            {/* Decorative cursor */}
            <div className="absolute top-8 right-8 bg-white rounded-lg p-2 shadow-lg hidden md:block">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-lime-500" />
                <span className="text-xs text-gray-600 font-medium">10k+ Jobs</span>
              </div>
            </div>

            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Find Your
                <br />
                <span className="relative">
                  Dream Job
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 10C50 2 150 2 198 10" stroke="#0f0f1a" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-700 max-w-md">
                Discover thousands of opportunities from top companies worldwide. Your career journey starts here.
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mt-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Job title or keyword"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-14 rounded-xl bg-white border-0 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-12 h-14 rounded-xl bg-white border-0 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-14 px-8 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                  >
                    Search
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>
            </div>

            {/* Decorative blob */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-lime-300 rounded-full blur-3xl opacity-50" />
          </div>

          {/* Stats Card - Purple */}
          <div className="md:col-span-2 bg-purple-600 rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-purple-200" />
              <span className="text-xs bg-purple-500 px-3 py-1 rounded-full">Live</span>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold">10,000+</p>
              <p className="text-purple-200 mt-1">Active Jobs</p>
            </div>
          </div>

          {/* Companies Card */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 text-gray-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-xl">
                <Briefcase className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">5,000+</p>
                <p className="text-gray-500 text-sm">Companies</p>
              </div>
            </div>
            <div className="mt-4 flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white" />
              ))}
              <div className="w-8 h-8 rounded-full bg-lime-400 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-900">
                +
              </div>
            </div>
          </div>

          {/* Popular Searches Card */}
          <div className="md:col-span-2 lg:col-span-3 bg-gray-800 rounded-3xl p-6">
            <p className="text-sm text-gray-400 mb-4">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {['Frontend Developer', 'Product Manager', 'Data Scientist', 'UI Designer', 'Remote'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => router.push(`/jobs?q=${tag}`)}
                  className="px-4 py-2 bg-gray-700 hover:bg-lime-400 hover:text-gray-900 rounded-full text-sm transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Users Card */}
          <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl p-6">
            <Users className="h-8 w-8 text-white/80" />
            <div className="mt-4">
              <p className="text-3xl font-bold">50,000+</p>
              <p className="text-white/80">Job Seekers Trust Us</p>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-white text-white" />
              ))}
              <span className="ml-2 text-sm">4.9 Rating</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

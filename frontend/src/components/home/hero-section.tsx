'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Container } from '@/components/layout/container'

export function HeroSection() {
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
    <section className="relative bg-gradient-to-b from-primary/10 to-background py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Find Your Dream Job
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Discover thousands of job opportunities from top companies around the world.
            Start your career journey today.
          </p>

          <form onSubmit={handleSearch} className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Search Jobs
              </Button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Popular searches:</span>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => router.push('/jobs?q=Frontend Developer')}
            >
              Frontend Developer
            </Button>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => router.push('/jobs?q=Product Manager')}
            >
              Product Manager
            </Button>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => router.push('/jobs?q=Data Scientist')}
            >
              Data Scientist
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

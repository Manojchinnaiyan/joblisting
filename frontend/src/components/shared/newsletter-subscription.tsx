'use client'

import { useState } from 'react'
import { Mail, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { newsletterApi } from '@/lib/api/newsletter'

interface NewsletterSubscriptionProps {
  variant?: 'default' | 'compact' | 'inline'
  className?: string
  title?: string
  description?: string
}

export function NewsletterSubscription({
  variant = 'default',
  className,
  title = 'Stay Updated',
  description = 'Subscribe to our newsletter for the latest job opportunities and career tips.',
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      await newsletterApi.subscribe(email)

      setIsSubscribed(true)
      setEmail('')
      toast.success('Successfully subscribed to newsletter!')
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.info('You are already subscribed to our newsletter!')
        setIsSubscribed(true)
      } else {
        toast.error('Failed to subscribe. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <div className={cn('flex items-center gap-2 text-green-600', className)}>
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Thanks for subscribing!</span>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
        </Button>
      </form>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <span className="font-semibold">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
          </Button>
        </form>
      </div>
    )
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              'Subscribe to Newsletter'
            )}
          </Button>
        </form>
        <p className="mt-3 text-xs text-center text-muted-foreground">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </CardContent>
    </Card>
  )
}

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { ROUTES } from '@/lib/constants'

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to Find Your Dream Job?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of job seekers who have found their perfect role through our platform.
            Start your journey today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href={ROUTES.REGISTER}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={ROUTES.JOBS}>Browse Jobs</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

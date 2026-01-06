import { Container } from '@/components/layout/container'
import Link from 'next/link'

export function SEOContentSection() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <Container>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Your Gateway to Global Career Opportunities
          </h2>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="text-lg leading-relaxed mb-6">
              JobsWorld is a comprehensive job search platform connecting talented professionals
              with leading employers worldwide. Whether you&apos;re seeking remote work opportunities,
              international positions, or local career advancement, our platform provides access
              to thousands of verified job listings across all industries.
            </p>

            <div className="grid md:grid-cols-2 gap-8 my-8">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  For Job Seekers
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Access to remote jobs from top global companies</li>
                  <li>Advanced search filters by location, salary, and job type</li>
                  <li>One-click applications with your saved profile</li>
                  <li>Real-time job alerts and notifications</li>
                  <li>Career resources and interview preparation guides</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  For Employers
                </h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Post jobs and reach qualified candidates globally</li>
                  <li>Advanced applicant tracking system</li>
                  <li>Company profile pages with branding</li>
                  <li>Candidate filtering and management tools</li>
                  <li>Analytics and recruitment insights</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3">
              Popular Job Categories
            </h3>
            <p className="mb-4">
              Explore opportunities across diverse industries including software engineering,
              data science, product management, marketing, sales, design, finance, healthcare,
              and more. Our platform features positions from entry-level to executive roles,
              with options for full-time, part-time, contract, and freelance work arrangements.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3">
              Remote Work & International Opportunities
            </h3>
            <p className="mb-4">
              The future of work is global and flexible. JobsWorld specializes in connecting
              professionals with remote-first companies and international employers who value
              talent regardless of location. Find work-from-home jobs, hybrid positions, and
              relocation opportunities with visa sponsorship.
            </p>

            <div className="flex flex-wrap gap-4 mt-8 justify-center">
              <Link
                href="/jobs"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Browse All Jobs
              </Link>
              <Link
                href="/companies"
                className="inline-flex items-center px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
              >
                View Companies
              </Link>
              <Link
                href="/blogs"
                className="inline-flex items-center px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
              >
                Career Resources
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

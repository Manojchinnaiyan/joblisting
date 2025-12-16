import { Container } from '@/components/layout/container'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - JobsWorld | Global Job Search Platform',
  description: 'JobsWorld connects talented professionals worldwide with remote jobs, international opportunities, and career openings across all industries and countries.',
  keywords: ['about jobsworld', 'job search platform', 'remote jobs platform', 'international job portal', 'global employment'],
}

export default function AboutPage() {
  return (
    <Container className="py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About JobsWorld</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            Welcome to JobsWorld, your global gateway to career opportunities. We connect talented professionals
            from around the world with remote jobs, international positions, and exciting career opportunities
            across all industries.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p className="text-muted-foreground">
            We believe that talent has no borders. Our mission is to democratize access to job opportunities
            by connecting professionals with employers worldwide. Whether you&apos;re looking for remote work,
            international positions, or local opportunities, JobsWorld is your trusted partner.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">What We Offer</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><strong>Remote Jobs:</strong> Work from anywhere with our extensive remote job listings</li>
            <li><strong>International Opportunities:</strong> Find jobs in USA, UK, Europe, Asia, and beyond</li>
            <li><strong>All Industries:</strong> Tech, Marketing, Sales, Design, Finance, Healthcare, and more</li>
            <li><strong>All Experience Levels:</strong> Entry-level to executive positions</li>
            <li><strong>Advanced Search:</strong> Filter by location, salary, job type, and workplace preference</li>
            <li><strong>Company Insights:</strong> Reviews, ratings, and culture information</li>
            <li><strong>Easy Applications:</strong> One-click apply with your JobsWorld profile</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Why Choose JobsWorld</h2>
          <p className="text-muted-foreground">
            With a global perspective and local expertise, we understand what it takes to match the right
            candidate with the right opportunity. Our platform is designed with both job seekers and employers
            in mind, creating a seamless experience for finding and hiring talent across borders.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Global Reach</h2>
          <p className="text-muted-foreground">
            JobsWorld serves job seekers and employers across the globe. From Silicon Valley startups to
            European enterprises, from Asian tech giants to emerging markets - we connect talent with
            opportunity wherever they may be.
          </p>
        </div>
      </div>
    </Container>
  )
}

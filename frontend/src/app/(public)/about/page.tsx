import { Container } from '@/components/layout/container'
import { Metadata } from 'next'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'
import { Users, Globe, Shield, Zap, Target, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: `About Us - ${APP_NAME} | Global Job Search Platform`,
  description: `${APP_NAME} connects talented professionals worldwide with remote jobs, international opportunities, and career openings across all industries and countries. Learn about our mission, values, and commitment to helping you find your dream job.`,
  keywords: ['about jobsworld', 'job search platform', 'remote jobs platform', 'international job portal', 'global employment', 'career opportunities'],
}

const values = [
  {
    icon: Users,
    title: 'People First',
    description: 'We believe every job seeker deserves access to quality opportunities regardless of their location, background, or experience level.',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Breaking down geographical barriers to connect talent with opportunities worldwide, from Silicon Valley to emerging markets.',
  },
  {
    icon: Shield,
    title: 'Trust & Transparency',
    description: 'We verify employers and maintain strict quality standards to ensure every listing is legitimate and valuable.',
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'Continuously improving our platform with cutting-edge technology to make job searching faster and more effective.',
  },
  {
    icon: Target,
    title: 'Precision Matching',
    description: 'Our advanced algorithms help match the right candidates with the right opportunities for mutual success.',
  },
  {
    icon: Heart,
    title: 'Community',
    description: 'Building a supportive community where professionals can grow, learn, and advance their careers together.',
  },
]

export default function AboutPage() {
  return (
    <Container className="py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About {APP_NAME}</h1>
          <p className="text-xl text-muted-foreground">
            Connecting talented professionals with life-changing career opportunities worldwide
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          {/* Introduction */}
          <section className="mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Welcome to {APP_NAME}, your premier destination for discovering career opportunities
              that match your skills, aspirations, and lifestyle preferences. Founded with a simple
              yet powerful vision, we set out to transform how professionals find meaningful work
              in an increasingly connected world.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mt-4">
              In today&apos;s dynamic job market, talented individuals often struggle to find positions
              that truly align with their expertise and career goals. Traditional job boards can be
              overwhelming, filled with outdated listings and generic opportunities that don&apos;t
              account for the unique needs of modern professionals. That&apos;s where {APP_NAME} comes in.
            </p>
          </section>

          {/* Mission Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              We believe that talent has no borders. Our mission is to democratize access to job
              opportunities by connecting professionals with employers worldwide. Whether you&apos;re
              seeking remote work that offers flexibility, international positions that expand your
              horizons, or local opportunities that advance your career, {APP_NAME} serves as your
              trusted partner in navigating the global job market.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We are committed to creating a platform where job seekers can discover opportunities
              that not only match their technical skills but also align with their values, work-life
              balance preferences, and long-term career aspirations. Every feature we build, every
              improvement we make, is designed with the job seeker&apos;s success in mind.
            </p>
          </section>

          {/* What We Offer Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
            <p className="text-muted-foreground mb-6">
              {APP_NAME} provides a comprehensive suite of tools and resources designed to streamline
              your job search and maximize your chances of landing your dream position:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Remote Job Opportunities</h3>
                <p className="text-sm text-muted-foreground">
                  Access thousands of verified remote positions from companies that embrace flexible
                  work arrangements. Work from anywhere while building a rewarding career.
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">International Positions</h3>
                <p className="text-sm text-muted-foreground">
                  Discover opportunities in the USA, UK, Europe, Asia, and beyond. Many positions
                  offer visa sponsorship and relocation assistance for qualified candidates.
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Diverse Industries</h3>
                <p className="text-sm text-muted-foreground">
                  From technology and engineering to marketing, finance, healthcare, and design,
                  we cover every major industry and profession.
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">All Experience Levels</h3>
                <p className="text-sm text-muted-foreground">
                  Whether you&apos;re a fresh graduate seeking entry-level roles or a seasoned executive
                  looking for your next leadership position, we have opportunities for you.
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Advanced Search Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Filter jobs by location, salary range, job type, experience level, and workplace
                  preference to find exactly what you&apos;re looking for.
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Career Resources</h3>
                <p className="text-sm text-muted-foreground">
                  Access our blog featuring interview tips, resume guides, salary negotiation
                  strategies, and career development advice from industry experts.
                </p>
              </div>
            </div>
          </section>

          {/* Our Values Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Our Core Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value) => {
                const Icon = value.icon
                return (
                  <div key={value.title} className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* For Employers Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">For Employers</h2>
            <p className="text-muted-foreground leading-relaxed">
              {APP_NAME} isn&apos;t just for job seekers. We partner with companies of all sizes—from
              innovative startups to Fortune 500 enterprises—to help them find exceptional talent.
              Our employer tools include job posting management, applicant tracking, candidate
              filtering, and analytics to streamline the hiring process.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We understand that finding the right candidate is just as challenging as finding the
              right job. That&apos;s why we&apos;ve built features that help employers identify candidates
              who not only have the required skills but also fit their company culture and values.
            </p>
          </section>

          {/* Global Reach Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Global Reach, Local Expertise</h2>
            <p className="text-muted-foreground leading-relaxed">
              With a global perspective and understanding of local markets, we connect talent with
              opportunity wherever they may be. From Silicon Valley startups revolutionizing technology
              to European enterprises leading in sustainability, from Asian tech giants driving
              innovation to emerging market companies creating new possibilities—{APP_NAME} bridges
              the gap between ambition and achievement.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Our platform serves job seekers and employers across more than 100 countries, with
              particular strength in markets including the United States, United Kingdom, Canada,
              Australia, Germany, India, Singapore, and the United Arab Emirates. We continuously
              expand our reach to ensure that talented professionals everywhere have access to
              meaningful career opportunities.
            </p>
          </section>

          {/* Commitment Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Commitment to You</h2>
            <p className="text-muted-foreground leading-relaxed">
              At {APP_NAME}, we are committed to maintaining the highest standards of quality and
              integrity. Every job listing on our platform is reviewed to ensure it meets our
              standards for legitimacy and professionalism. We take user privacy seriously and
              implement robust security measures to protect your personal information.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We believe that finding the right job can be life-changing, and we don&apos;t take that
              responsibility lightly. Our team works tirelessly to improve the platform, add new
              features, and ensure that your experience with {APP_NAME} is nothing short of excellent.
            </p>
          </section>

          {/* CTA Section */}
          <section className="text-center p-8 bg-muted/50 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Start Your Journey Today</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of professionals who have found their dream jobs through {APP_NAME}.
              Whether you&apos;re actively searching or just exploring your options, we&apos;re here to help
              you take the next step in your career.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/jobs"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Browse Jobs
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
              >
                Create Account
              </Link>
            </div>
          </section>
        </div>
      </div>
    </Container>
  )
}

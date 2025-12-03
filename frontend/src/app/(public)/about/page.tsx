import { Container } from '@/components/layout/container'

export default function AboutPage() {
  return (
    <Container className="py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About JobPlatform</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            Welcome to JobPlatform, your trusted partner in finding the perfect career opportunity.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p className="text-muted-foreground">
            We connect talented professionals with companies that value their skills and potential.
            Our platform makes job searching simple, efficient, and rewarding.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">What We Offer</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>Access to thousands of job listings from top companies</li>
            <li>Advanced search and filtering capabilities</li>
            <li>Personalized job recommendations</li>
            <li>Company insights and reviews</li>
            <li>Easy application process</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Why Choose Us</h2>
          <p className="text-muted-foreground">
            With years of experience in the recruitment industry, we understand what it takes
            to match the right candidate with the right opportunity. Our platform is designed
            with both job seekers and employers in mind, creating a seamless experience for all.
          </p>
        </div>
      </div>
    </Container>
  )
}

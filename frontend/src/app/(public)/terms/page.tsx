import { Container } from '@/components/layout/container'
import { Metadata } from 'next'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Terms of Service - ${APP_NAME}`,
  description: `Read the terms and conditions for using ${APP_NAME}. Understand your rights and responsibilities when using our job search platform.`,
}

export default function TermsPage() {
  return (
    <Container className="py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 25, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using {APP_NAME} (&quot;the Service&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our Service. We reserve the right
              to modify these Terms at any time, and your continued use of the Service constitutes acceptance
              of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              {APP_NAME} is an online job search platform that connects job seekers with employers. We provide
              tools for job posting, job searching, application management, company profiles, and related
              career services. The Service is available via our website and may include mobile applications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">To use certain features of the Service, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Be responsible for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We reserve the right to suspend or terminate accounts that violate these Terms or for any
              other reason at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Conduct</h2>
            <p className="text-muted-foreground mb-4">When using the Service, you agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Post false, misleading, or fraudulent job listings or applications</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Scrape, crawl, or use automated means to access the Service without permission</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post discriminatory content or job listings that violate employment laws</li>
              <li>Use the Service for any illegal purpose</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Collect or store personal data about other users without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Job Seekers</h2>
            <p className="text-muted-foreground mb-4">As a job seeker, you acknowledge and agree that:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Your profile and resume may be viewed by employers on the platform</li>
              <li>We do not guarantee employment or job offers</li>
              <li>You are solely responsible for verifying the legitimacy of employers and job offers</li>
              <li>Information you provide must be accurate and truthful</li>
              <li>You will not apply for positions for which you are not genuinely qualified or interested</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Employers</h2>
            <p className="text-muted-foreground mb-4">As an employer, you acknowledge and agree that:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Job postings must be for legitimate, actual job openings</li>
              <li>You will comply with all applicable employment and anti-discrimination laws</li>
              <li>You will not post jobs that require payment from applicants or are pyramid/MLM schemes</li>
              <li>Candidate information obtained through the Service will be used only for recruitment purposes</li>
              <li>You are responsible for your own hiring decisions and due diligence</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Content and Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              <strong>Your Content:</strong> You retain ownership of content you submit (resumes, job postings, etc.).
              By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use,
              display, and distribute your content in connection with the Service.
            </p>
            <p className="text-muted-foreground">
              <strong>Our Content:</strong> The Service and its original content, features, and functionality are owned
              by {APP_NAME} and are protected by copyright, trademark, and other intellectual property laws.
              You may not copy, modify, distribute, or create derivative works without our permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Links and Services</h2>
            <p className="text-muted-foreground">
              The Service may contain links to third-party websites or services. We are not responsible for
              the content, privacy policies, or practices of any third parties. Your use of third-party
              services is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers</h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS
              OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              WE DO NOT WARRANT THE ACCURACY OF JOB LISTINGS OR EMPLOYER/CANDIDATE INFORMATION.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {APP_NAME.toUpperCase()} AND ITS AFFILIATES SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF
              PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL
              NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST TWELVE MONTHS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless {APP_NAME}, its affiliates, officers, directors, employees,
              and agents from any claims, damages, losses, or expenses arising from your use of the Service,
              violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to the Service immediately, without prior
              notice, for any reason, including breach of these Terms. Upon termination, your right to use
              the Service will cease immediately. Provisions that by their nature should survive termination
              shall survive.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the State of
              California, United States, without regard to its conflict of law provisions. Any disputes
              shall be resolved in the courts located in San Francisco County, California.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will provide notice of material
              changes by posting the updated Terms on the Service with a new &quot;Last updated&quot; date.
              Your continued use after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                <strong>Email:</strong> info@jobsworld.in<br />
                <strong>Address:</strong> 123 Tech Hub Street, San Francisco, CA 94105
              </p>
            </div>
          </section>
        </div>
      </div>
    </Container>
  )
}

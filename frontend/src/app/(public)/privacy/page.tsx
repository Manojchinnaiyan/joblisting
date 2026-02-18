import { Container } from '@/components/layout/container'
import { Metadata } from 'next'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Privacy Policy - ${APP_NAME}`,
  description: `Learn how ${APP_NAME} collects, uses, and protects your personal information. Our privacy policy explains your rights and our data practices.`,
}

export default function PrivacyPage() {
  return (
    <Container className="py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 25, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to {APP_NAME} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Information:</strong> Name, email address, password, and profile details when you create an account</li>
              <li><strong>Profile Data:</strong> Resume, work history, education, skills, and other career-related information</li>
              <li><strong>Job Applications:</strong> Information submitted when applying for jobs through our platform</li>
              <li><strong>Communications:</strong> Messages, feedback, and support requests you send to us</li>
              <li><strong>Payment Information:</strong> Billing details for premium services (processed securely by third-party payment processors)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Collected Automatically</h2>
            <p className="text-muted-foreground mb-4">When you access our services, we automatically collect:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, clicks, and navigation patterns</li>
              <li><strong>Location Data:</strong> General location based on IP address</li>
              <li><strong>Cookies and Tracking:</strong> Information collected through cookies and similar technologies (see our Cookie Policy)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide, maintain, and improve our services</li>
              <li>Match job seekers with relevant job opportunities</li>
              <li>Process job applications and facilitate communication between candidates and employers</li>
              <li>Send you notifications about job matches, application updates, and platform features</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Detect and prevent fraud, abuse, and security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Sharing Your Information</h2>
            <p className="text-muted-foreground mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Employers:</strong> When you apply for jobs, your profile and application materials are shared with the hiring company</li>
              <li><strong>Service Providers:</strong> Third parties that help us operate our platform (hosting, analytics, email services)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not sell your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal information,
              including encryption, secure servers, and access controls. However, no method of transmission over
              the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and personal data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Restrict Processing:</strong> Limit how we use your data in certain circumstances</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal information for as long as your account is active or as needed to provide
              our services. We may also retain certain information for legal compliance, dispute resolution,
              and enforcement of our agreements. You can request deletion of your account at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for such transfers in compliance with applicable
              data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not intended for individuals under 16 years of age. We do not knowingly collect
              personal information from children. If you believe we have collected information from a child,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you
              to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
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

import { Container } from '@/components/layout/container'
import { Metadata } from 'next'
import { APP_NAME } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Cookie, Shield, BarChart3, Settings } from 'lucide-react'

export const metadata: Metadata = {
  title: `Cookie Policy - ${APP_NAME}`,
  description: `Learn about how ${APP_NAME} uses cookies and similar technologies to improve your experience on our platform.`,
}

export default function CookiesPage() {
  return (
    <Container className="py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 25, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
            <p className="text-muted-foreground">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile)
              when you visit a website. They help websites remember your preferences, keep you logged in,
              and understand how you use the site. Cookies are widely used to make websites work more
              efficiently and provide a better user experience.
            </p>
          </section>

          {/* Cookie Types Cards */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Types of Cookies We Use</h2>
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    Essential Cookies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    These cookies are necessary for the website to function properly. They enable core
                    functionality such as security, network management, and account authentication.
                    You cannot opt out of these cookies as the website would not work without them.
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <strong>Examples:</strong> Session cookies, authentication tokens, CSRF protection
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Settings className="h-5 w-5 text-green-600" />
                    </div>
                    Functional Cookies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    These cookies enable enhanced functionality and personalization, such as remembering
                    your preferences, language settings, and customized features. If you disable these
                    cookies, some features may not work properly.
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <strong>Examples:</strong> Language preferences, theme settings, saved searches
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    Analytics Cookies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    These cookies help us understand how visitors interact with our website by collecting
                    and reporting information anonymously. This helps us improve our services and user experience.
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <strong>Examples:</strong> Google Analytics, page view tracking, error monitoring
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Cookie className="h-5 w-5 text-orange-600" />
                    </div>
                    Marketing Cookies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    These cookies are used to track visitors across websites to display relevant
                    advertisements. They help measure the effectiveness of advertising campaigns
                    and limit the number of times you see an ad.
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <strong>Examples:</strong> Social media pixels, retargeting cookies, ad tracking
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Why We Need Cookies</h2>
            <p className="text-muted-foreground mb-4">
              {APP_NAME} uses cookies for several important purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Authentication:</strong> Keep you logged in as you navigate between pages</li>
              <li><strong>Security:</strong> Protect your account and prevent fraudulent activity</li>
              <li><strong>Preferences:</strong> Remember your settings like language and display preferences</li>
              <li><strong>Performance:</strong> Understand how our site is used to make improvements</li>
              <li><strong>Job Matching:</strong> Remember your job searches and preferences to show relevant opportunities</li>
              <li><strong>Application Tracking:</strong> Keep track of jobs you&apos;ve applied to and saved</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Specific Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 border-b">Cookie Name</th>
                    <th className="text-left p-3 border-b">Purpose</th>
                    <th className="text-left p-3 border-b">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="p-3 border-b font-mono text-xs">session_token</td>
                    <td className="p-3 border-b">User authentication</td>
                    <td className="p-3 border-b">Session</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-mono text-xs">refresh_token</td>
                    <td className="p-3 border-b">Maintain login state</td>
                    <td className="p-3 border-b">30 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-mono text-xs">preferences</td>
                    <td className="p-3 border-b">User preferences</td>
                    <td className="p-3 border-b">1 year</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-mono text-xs">_ga</td>
                    <td className="p-3 border-b">Google Analytics</td>
                    <td className="p-3 border-b">2 years</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs">csrf_token</td>
                    <td className="p-3">Security protection</td>
                    <td className="p-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
            <p className="text-muted-foreground">
              Some cookies are placed by third-party services that appear on our pages. We use the following
              third-party services that may set cookies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li><strong>Google Analytics:</strong> Website usage analytics</li>
              <li><strong>Google OAuth:</strong> Social login functionality</li>
              <li><strong>Stripe:</strong> Payment processing (for premium features)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not control these third-party cookies. Please refer to their respective privacy policies
              for more information about how they use cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
            <p className="text-muted-foreground mb-4">
              You have several options for managing cookies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Browser Settings:</strong> Most browsers allow you to view, manage, and delete cookies
                through their settings. Note that blocking all cookies may impact website functionality.
              </li>
              <li>
                <strong>Opt-Out Tools:</strong> You can opt out of Google Analytics by installing the
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                  Google Analytics Opt-out Browser Add-on
                </a>
              </li>
              <li>
                <strong>Do Not Track:</strong> Some browsers support &quot;Do Not Track&quot; signals. We currently
                do not respond to DNT signals, but you can use the methods above to control cookies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Browser-Specific Instructions</h2>
            <p className="text-muted-foreground mb-4">
              Here&apos;s how to manage cookies in popular browsers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation,
              or our data practices. When we make changes, we will update the &quot;Last updated&quot; date at the top
              of this policy. We encourage you to periodically review this page for the latest information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about our use of cookies, please contact us:
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

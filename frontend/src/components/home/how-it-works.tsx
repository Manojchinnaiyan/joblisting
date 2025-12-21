import { Search, FileText, Send, CheckCircle } from 'lucide-react'
import { Container } from '@/components/layout/container'

const steps = [
  {
    icon: Search,
    title: 'Search Jobs',
    description: 'Browse through thousands of job listings from top companies',
  },
  {
    icon: FileText,
    title: 'Create Profile',
    description: 'Build your professional profile and upload your resume',
  },
  {
    icon: Send,
    title: 'Apply',
    description: 'Submit applications with just one click',
  },
  {
    icon: CheckCircle,
    title: 'Get Hired',
    description: 'Connect with employers and land your dream job',
  },
]

export function HowItWorks() {
  return (
    <section className="py-10 md:py-14">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground mt-2">
            Get started in four simple steps
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border" />
                )}
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

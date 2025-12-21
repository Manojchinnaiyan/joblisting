import { Briefcase, Building2, Users, TrendingUp } from 'lucide-react'
import { Container } from '@/components/layout/container'

const stats = [
  {
    label: 'Active Jobs',
    value: '10,000+',
    icon: Briefcase,
  },
  {
    label: 'Companies',
    value: '5,000+',
    icon: Building2,
  },
  {
    label: 'Job Seekers',
    value: '50,000+',
    icon: Users,
  },
  {
    label: 'Success Rate',
    value: '95%',
    icon: TrendingUp,
  },
]

export function StatsSection() {
  return (
    <section className="py-10 md:py-14 bg-primary text-primary-foreground">
      <Container>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-foreground">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

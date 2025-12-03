import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BENEFIT_CATEGORIES } from '@/lib/constants'
import type { CompanyBenefit } from '@/types/company'

interface CompanyBenefitsProps {
  benefits: CompanyBenefit[]
}

export function CompanyBenefits({ benefits }: CompanyBenefitsProps) {
  if (!benefits || benefits.length === 0) {
    return null
  }

  const groupedBenefits = benefits.reduce((acc, benefit) => {
    if (!acc[benefit.category]) {
      acc[benefit.category] = []
    }
    acc[benefit.category].push(benefit)
    return acc
  }, {} as Record<string, CompanyBenefit[]>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benefits & Perks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedBenefits).map(([category, categoryBenefits]) => {
            const categoryInfo = BENEFIT_CATEGORIES.find((c) => c.value === category)
            return (
              <div key={category}>
                <h4 className="font-semibold mb-3">
                  {categoryInfo?.label || category}
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {categoryBenefits.map((benefit) => (
                    <div key={benefit.id} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">{benefit.title}</p>
                        {benefit.description && (
                          <p className="text-sm text-muted-foreground">
                            {benefit.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

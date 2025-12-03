import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Company } from '@/types/company'

interface CompanyAboutProps {
  company: Company
}

export function CompanyAbout({ company }: CompanyAboutProps) {
  if (!company.description) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>About {company.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-line">{company.description}</p>
      </CardContent>
    </Card>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { Users, Briefcase, BadgeCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Company } from '@/types/company'

interface CompanyCardProps {
  company: Company
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link href={`/companies/${company.slug}`}>
      <Card className="hover:shadow-md transition-shadow h-full group">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Company Logo */}
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                alt={company.name}
                width={56}
                height={56}
                className="rounded-lg object-contain shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-primary">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Company Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
                  {company.name}
                </h3>
                {company.is_verified && (
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
              {company.tagline && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {company.tagline}
                </p>
              )}

              {/* Description */}
              {company.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {company.description}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <Badge variant="secondary" className="text-xs font-normal">
                  {company.industry}
                </Badge>
                {company.is_featured && (
                  <Badge className="text-xs font-normal">Featured</Badge>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{company.company_size} employees</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>{company.active_jobs} open positions</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

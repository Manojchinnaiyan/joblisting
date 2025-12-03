import Image from 'next/image'
import { BadgeCheck, MapPin, Users, Calendar, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Company } from '@/types/company'

interface CompanyHeaderProps {
  company: Company
  children?: React.ReactNode
}

export function CompanyHeader({ company, children }: CompanyHeaderProps) {
  return (
    <div className="space-y-6">
      {company.cover_image_url && (
        <div className="w-full h-48 md:h-64 relative rounded-lg overflow-hidden">
          <Image
            src={company.cover_image_url}
            alt={company.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex gap-6 items-start flex-1">
          {company.logo_url ? (
            <Image
              src={company.logo_url}
              alt={company.name}
              width={100}
              height={100}
              className="rounded object-contain border"
            />
          ) : (
            <div className="h-24 w-24 rounded bg-muted flex items-center justify-center border">
              <span className="text-3xl font-bold text-muted-foreground">
                {company.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{company.name}</h1>
              {company.is_verified && (
                <BadgeCheck className="h-6 w-6 text-primary" />
              )}
            </div>

            {company.tagline && (
              <p className="text-lg text-muted-foreground mb-4">{company.tagline}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{company.industry}</Badge>
              {company.is_featured && <Badge>Featured</Badge>}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{company.company_size} employees</span>
              </div>
              {company.founded_year && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Founded in {company.founded_year}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <Link
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Website
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  )
}

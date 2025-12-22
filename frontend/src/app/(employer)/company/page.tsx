'use client'

import Link from 'next/link'
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Users,
  Briefcase,
  Star,
  Edit,
  Image as ImageIcon,
  Gift,
  BadgeCheck,
  ExternalLink,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useMyCompany } from '@/hooks/employer/use-company'
import { useCompanyLocations } from '@/hooks/employer/use-locations'
import { useCompanyBenefits } from '@/hooks/employer/use-benefits'
import { format } from 'date-fns'

export default function CompanyProfilePage() {
  const { data: company, isLoading } = useMyCompany()
  const { data: locations } = useCompanyLocations()
  const { data: benefits } = useCompanyBenefits()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">No Company Found</h2>
        <p className="mt-2 text-muted-foreground">Set up your company to get started</p>
        <Button asChild className="mt-4">
          <Link href="/company/setup">Set Up Company</Link>
        </Button>
      </div>
    )
  }

  const headquarters = locations?.find((l) => l.is_headquarters)

  return (
    <div className="space-y-6">
      {/* Header with Cover and Logo */}
      <div className="relative">
        {company.cover_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={company.cover_image_url}
            alt="Company cover"
            className="h-48 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="h-48 w-full rounded-lg bg-gradient-to-r from-primary/20 to-primary/10" />
        )}
        <div className="absolute right-4 top-4 flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/company/branding">
              <ImageIcon className="mr-2 h-4 w-4" />
              Edit Branding
            </Link>
          </Button>
        </div>
      </div>

      {/* Company Info with Avatar */}
      <div className="relative -mt-12 px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-background bg-background">
              <AvatarImage src={company.logo_url} alt={company.name} />
              <AvatarFallback className="text-2xl">{company.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{company.name}</h1>
                {company.is_verified && (
                  <BadgeCheck className="h-6 w-6 text-blue-500" />
                )}
              </div>
              {company.tagline && (
                <p className="text-lg text-muted-foreground">{company.tagline}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 pb-1">
            <Button variant="outline" asChild>
              <Link href={`/companies/${company.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public Page
              </Link>
            </Button>
            <Button asChild>
              <Link href="/company/edit">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
          {company.company_size && (
            <Badge variant="outline">{company.company_size} employees</Badge>
          )}
          {company.founded_year && (
            <Badge variant="outline">Founded {company.founded_year}</Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{company.active_jobs || 0}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{company.followers_count}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-yellow-100 p-3 text-yellow-600">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {company.average_rating?.toFixed(1) || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                {company.reviews_count} Reviews
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{locations?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Locations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.description ? (
              <p className="whitespace-pre-wrap">{company.description}</p>
            ) : (
              <p className="text-muted-foreground">No description added yet.</p>
            )}

            {(company.mission || company.vision) && (
              <div className="grid gap-4 pt-4 border-t">
                {company.mission && (
                  <div>
                    <h4 className="font-semibold">Mission</h4>
                    <p className="text-muted-foreground">{company.mission}</p>
                  </div>
                )}
                {company.vision && (
                  <div>
                    <h4 className="font-semibold">Vision</h4>
                    <p className="text-muted-foreground">{company.vision}</p>
                  </div>
                )}
              </div>
            )}

            {company.culture_description && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold">Culture</h4>
                <p className="text-muted-foreground">{company.culture_description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact & Links */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {headquarters && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{headquarters.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[headquarters.address, headquarters.city, headquarters.state, headquarters.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}

            {company.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            {company.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                  {company.email}
                </a>
              </div>
            )}

            {company.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <a href={`tel:${company.phone}`} className="text-primary hover:underline">
                  {company.phone}
                </a>
              </div>
            )}

            {company.created_at && (
              <div className="flex items-center gap-3 pt-4 border-t">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Member since {format(new Date(company.created_at), 'MMMM yyyy')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Company</CardTitle>
          <CardDescription>Quick links to manage different aspects of your company profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/company/edit">
                <Edit className="h-6 w-6" />
                <span>Edit Profile</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/company/branding">
                <ImageIcon className="h-6 w-6" />
                <span>Branding</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/company/locations">
                <MapPin className="h-6 w-6" />
                <span>Locations ({locations?.length || 0})</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/company/benefits">
                <Gift className="h-6 w-6" />
                <span>Benefits ({benefits?.length || 0})</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/company/media">
                <ImageIcon className="h-6 w-6" />
                <span>Media Gallery</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/company/reviews">
                <Star className="h-6 w-6" />
                <span>Reviews ({company.reviews_count})</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/company/verification">
                <BadgeCheck className="h-6 w-6" />
                <span>{company.is_verified ? 'Verified' : 'Get Verified'}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/team">
                <Users className="h-6 w-6" />
                <span>Team</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

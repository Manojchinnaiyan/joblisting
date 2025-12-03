'use client'

import Link from 'next/link'
import { Edit, MapPin, Briefcase, Mail, Phone, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useProfile } from '@/hooks/use-profile'
import { useExperiences } from '@/hooks/use-experience'
import { useEducation } from '@/hooks/use-education'
import { useSkills } from '@/hooks/use-skills'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: experiences = [] } = useExperiences()
  const { data: education = [] } = useEducation()
  const { data: skills = [] } = useSkills()

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  const fullName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : 'Job Seeker'

  const location = [profile?.city, profile?.state, profile?.country]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your professional information
          </p>
        </div>
        <Button asChild>
          <Link href="/profile/edit">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-2xl">
                {fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">{fullName}</h2>
              {profile?.headline && (
                <p className="text-lg text-muted-foreground mt-1">
                  {profile.headline}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                {location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {location}
                  </div>
                )}
                {profile?.current_title && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {profile.current_title}
                    {profile.current_company && ` at ${profile.current_company}`}
                  </div>
                )}
                {profile?.email && profile?.show_email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                )}
                {profile?.phone && profile?.show_phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </div>
                )}
              </div>

              {profile?.open_to_opportunities && (
                <Badge className="mt-4" variant="secondary">
                  Open to Opportunities
                </Badge>
              )}
            </div>
          </div>

          {profile?.bio && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Work Experience</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/experience">Manage</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No work experience added yet
            </p>
          ) : (
            <div className="space-y-6">
              {experiences.slice(0, 3).map((exp) => (
                <div key={exp.id} className="flex gap-4">
                  <div className="mt-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{exp.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {exp.company_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(exp.start_date), 'MMM yyyy')} -{' '}
                      {exp.is_current
                        ? 'Present'
                        : exp.end_date
                        ? format(new Date(exp.end_date), 'MMM yyyy')
                        : 'Present'}
                    </p>
                    {exp.description && (
                      <p className="text-sm mt-2 line-clamp-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {experiences.length > 3 && (
                <Button variant="ghost" size="sm" asChild className="w-full">
                  <Link href="/profile/experience">
                    View all {experiences.length} experiences
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Education</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/education">Manage</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {education.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No education added yet
            </p>
          ) : (
            <div className="space-y-6">
              {education.slice(0, 3).map((edu) => (
                <div key={edu.id} className="flex gap-4">
                  <div className="mt-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{edu.institution_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {edu.degree_name || edu.degree_type} in {edu.field_of_study}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(edu.start_date), 'MMM yyyy')} -{' '}
                      {edu.is_current
                        ? 'Present'
                        : edu.end_date
                        ? format(new Date(edu.end_date), 'MMM yyyy')
                        : 'Present'}
                    </p>
                    {edu.grade && (
                      <p className="text-sm mt-1">Grade: {edu.grade}</p>
                    )}
                  </div>
                </div>
              ))}
              {education.length > 3 && (
                <Button variant="ghost" size="sm" asChild className="w-full">
                  <Link href="/profile/education">
                    View all {education.length} education entries
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Skills</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/skills">Manage</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No skills added yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill.id} variant="secondary">
                  {skill.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

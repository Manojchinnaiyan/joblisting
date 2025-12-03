'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  BookmarkPlus,
  BookmarkCheck,
  FileText,
  ExternalLink,
  Send,
  Linkedin,
  Github,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  useCandidate,
  useSaveCandidate,
  useUnsaveCandidate,
  useCandidateNotes,
  useAddCandidateNote,
} from '@/hooks/employer/use-candidates'

export default function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: candidate, isLoading } = useCandidate(id)
  const { data: notes } = useCandidateNotes(id)
  const saveCandidate = useSaveCandidate()
  const unsaveCandidate = useUnsaveCandidate()
  const addNote = useAddCandidateNote()

  const [newNote, setNewNote] = useState('')

  const handleSaveToggle = async () => {
    if (candidate?.is_saved) {
      await unsaveCandidate.mutateAsync(id)
    } else {
      await saveCandidate.mutateAsync({ candidate_id: id })
    }
  }

  const handleAddNote = async () => {
    if (newNote.trim()) {
      await addNote.mutateAsync({ candidateId: id, note: newNote })
      setNewNote('')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/candidates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Candidate not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/candidates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{candidate.first_name} {candidate.last_name}</h1>
            {candidate.headline && (
              <p className="text-muted-foreground">{candidate.headline}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={candidate.is_saved ? 'default' : 'outline'}
            onClick={handleSaveToggle}
          >
            {candidate.is_saved ? (
              <>
                <BookmarkCheck className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Save Candidate
              </>
            )}
          </Button>
          {candidate.email && (
            <Button asChild>
              <a href={`mailto:${candidate.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Contact
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={candidate.avatar_url} />
                  <AvatarFallback className="text-3xl">
                    {candidate.first_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">{candidate.first_name} {candidate.last_name}</h2>
                    {candidate.headline && (
                      <p className="text-lg text-muted-foreground">{candidate.headline}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {candidate.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {candidate.location}
                      </span>
                    )}
                    {candidate.years_of_experience && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {candidate.years_of_experience} years experience
                      </span>
                    )}
                    {candidate.is_open_to_work && (
                      <Badge variant="secondary">Open to Work</Badge>
                    )}
                  </div>
                  {/* Social Links */}
                  <div className="flex flex-wrap gap-2">
                    {candidate.linkedin_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="mr-1 h-4 w-4" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {candidate.github_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={candidate.github_url} target="_blank" rel="noopener noreferrer">
                          <Github className="mr-1 h-4 w-4" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {candidate.portfolio_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="mr-1 h-4 w-4" />
                          Portfolio
                        </a>
                      </Button>
                    )}
                    {candidate.resume_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="mr-1 h-4 w-4" />
                          Resume
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          {candidate.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{candidate.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          {candidate.experiences && candidate.experiences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {candidate.experiences.map((exp, index) => (
                  <div key={exp.id}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{exp.title}</h4>
                        <p className="text-muted-foreground">{exp.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date || 'Present'}
                          {exp.location && ` • ${exp.location}`}
                        </p>
                        {exp.description && (
                          <p className="mt-2 text-sm">{exp.description}</p>
                        )}
                      </div>
                    </div>
                    {index < candidate.experiences!.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {candidate.education && candidate.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {candidate.education.map((edu, index) => (
                  <div key={edu.id}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{edu.degree}</h4>
                        <p className="text-muted-foreground">{edu.school}</p>
                        {edu.field_of_study && <p className="text-sm text-muted-foreground">{edu.field_of_study}</p>}
                        <p className="text-sm text-muted-foreground">
                          {edu.start_date} - {edu.end_date || 'Present'}
                        </p>
                      </div>
                    </div>
                    {index < candidate.education!.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>
                Notes are only visible to your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note about this candidate..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addNote.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Notes List */}
              {notes?.notes && notes.notes.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  {notes.notes.map((note, index) => (
                    <div key={index} className="rounded-lg bg-muted p-3">
                      <p className="text-sm">{note}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${candidate.email}`} className="hover:underline">
                      {candidate.email}
                    </a>
                  </div>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${candidate.phone}`} className="hover:underline">
                      {candidate.phone}
                    </a>
                  </div>
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p>{candidate.location}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate.preferred_job_types && candidate.preferred_job_types.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Job Types</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {candidate.preferred_job_types.map((type) => (
                      <Badge key={type} variant="outline" className="capitalize text-xs">
                        {type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {candidate.expected_salary_min && (
                <div>
                  <p className="text-sm text-muted-foreground">Expected Salary</p>
                  <p className="font-medium">
                    {candidate.expected_salary_currency || '$'}
                    {candidate.expected_salary_min.toLocaleString()}
                    {candidate.expected_salary_max && ` - ${candidate.expected_salary_max.toLocaleString()}`}
                    /year
                  </p>
                </div>
              )}
              {candidate.availability && (
                <div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <p className="font-medium capitalize">
                    {candidate.availability.replace('_', ' ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {candidate.email && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`mailto:${candidate.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </a>
                </Button>
              )}
              {candidate.phone && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`tel:${candidate.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call Candidate
                  </a>
                </Button>
              )}
              {candidate.resume_url && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Download Resume
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

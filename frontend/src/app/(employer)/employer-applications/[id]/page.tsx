'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  ExternalLink,
  Star,
  Calendar,
  Clock,
  Send,
  Download,
  Linkedin,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useApplication,
  useUpdateApplicationStatus,
  useRateApplication,
  useAddApplicationNote,
  useApplicationNotes,
} from '@/hooks/employer/use-employer-applications'
import { ApplicationStatus } from '@/lib/api/employer/applications'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const statusConfig = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  reviewed: { label: 'Reviewed', color: 'bg-yellow-100 text-yellow-800' },
  shortlisted: { label: 'Shortlisted', color: 'bg-purple-100 text-purple-800' },
  interview: { label: 'Interview', color: 'bg-indigo-100 text-indigo-800' },
  offered: { label: 'Offered', color: 'bg-green-100 text-green-800' },
  hired: { label: 'Hired', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: application, isLoading } = useApplication(id)
  const { data: notes } = useApplicationNotes(id)
  const updateStatus = useUpdateApplicationStatus()
  const rateApplication = useRateApplication()
  const addNote = useAddApplicationNote()

  const [newNote, setNewNote] = useState('')
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus.mutateAsync({ id, data: { status: newStatus as ApplicationStatus } })
  }

  const handleRating = async (rating: number) => {
    await rateApplication.mutateAsync({ id, data: { rating } })
  }

  const handleAddNote = async () => {
    if (newNote.trim()) {
      await addNote.mutateAsync({ applicationId: id, note: newNote })
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

  if (!application) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/employer-applications">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Application not found</h1>
        </div>
      </div>
    )
  }

  const status = statusConfig[application.status as keyof typeof statusConfig]
  const currentRating = application.rating || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/employer-applications">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{application.applicant_name}</h1>
            <p className="text-muted-foreground">
              Applied for{' '}
              <Link href={`/jobs/${application.job_id}`} className="hover:underline text-primary">
                {application.job_title}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={application.status} onValueChange={handleStatusChange}>
            <SelectTrigger className={cn('w-[160px]', status?.color)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offered">Offered</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          {application.resume_url && (
            <Button variant="outline" asChild>
              <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Resume
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Applicant Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={application.applicant_avatar} />
                  <AvatarFallback className="text-2xl">
                    {application.applicant_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold">{application.applicant_name}</h3>
                    {application.applicant_headline && (
                      <p className="text-muted-foreground">{application.applicant_headline}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {application.applicant_email && (
                      <a
                        href={`mailto:${application.applicant_email}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Mail className="h-4 w-4" />
                        {application.applicant_email}
                      </a>
                    )}
                    {application.applicant_phone && (
                      <a
                        href={`tel:${application.applicant_phone}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Phone className="h-4 w-4" />
                        {application.applicant_phone}
                      </a>
                    )}
                    {application.applicant_location && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {application.applicant_location}
                      </span>
                    )}
                  </div>
                  {/* Social Links */}
                  <div className="flex gap-2">
                    {application.linkedin_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={application.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="mr-1 h-4 w-4" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {application.portfolio_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="mr-1 h-4 w-4" />
                          Portfolio
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          {application.cover_letter && (
            <Card>
              <CardHeader>
                <CardTitle>Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{application.cover_letter}</p>
              </CardContent>
            </Card>
          )}

          {/* Custom Answers */}
          {application.answers && application.answers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Application Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.answers.map((answer, index) => (
                  <div key={index}>
                    <p className="font-medium">{answer.question}</p>
                    <p className="text-muted-foreground mt-1">{answer.answer}</p>
                    {index < application.answers!.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
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
              {notes && notes.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg bg-muted p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{note.author_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        star <= (hoveredRating || currentRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {currentRating > 0 ? `Rated ${currentRating} star${currentRating !== 1 ? 's' : ''}` : 'Not rated yet'}
              </p>
            </CardContent>
          </Card>

          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Applied</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(application.applied_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                {application.reviewed_at && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Reviewed</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(application.reviewed_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
                {application.status_history?.map((history, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{history.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(history.changed_at), 'MMM d, yyyy h:mm a')}
                      </p>
                      {history.changed_by && (
                        <p className="text-xs text-muted-foreground">by {history.changed_by}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`mailto:${application.applicant_email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </a>
              </Button>
              {application.applicant_phone && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`tel:${application.applicant_phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call Candidate
                  </a>
                </Button>
              )}
              {application.resume_url && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    View Resume
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Skills Match (if available) */}
          {application.skills && application.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {application.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

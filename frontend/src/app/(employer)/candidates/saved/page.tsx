'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  MapPin,
  Briefcase,
  BookmarkCheck,
  Mail,
  Trash2,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useSavedCandidates,
  useUnsaveCandidate,
} from '@/hooks/employer/use-candidates'
import { formatDistanceToNow } from 'date-fns'

export default function SavedCandidatesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [removingCandidate, setRemovingCandidate] = useState<{ id: string; name: string } | null>(null)

  const { data, isLoading } = useSavedCandidates({
    page,
    limit: 20,
  })

  const unsaveCandidate = useUnsaveCandidate()

  const handleRemove = async () => {
    if (removingCandidate) {
      await unsaveCandidate.mutateAsync(removingCandidate.id)
      setRemovingCandidate(null)
    }
  }

  const candidates = data?.candidates || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/candidates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Saved Candidates</h1>
          <p className="text-muted-foreground">
            {total} candidate{total !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search saved candidates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Candidates List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookmarkCheck className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No saved candidates</h3>
            <p className="mt-2 text-muted-foreground text-center">
              {search
                ? 'No candidates match your search'
                : 'Save candidates from the search page to see them here'}
            </p>
            {!search && (
              <Button className="mt-4" asChild>
                <Link href="/candidates">Search Candidates</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidates.map((savedCandidate) => (
            <Card key={savedCandidate.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  {/* Avatar and Basic Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={savedCandidate.candidate.avatar_url} />
                      <AvatarFallback className="text-xl">
                        {savedCandidate.candidate.first_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/candidates/${savedCandidate.candidate_id}`}
                        className="text-lg font-semibold hover:underline"
                      >
                        {savedCandidate.candidate.first_name} {savedCandidate.candidate.last_name}
                      </Link>
                      {savedCandidate.candidate.headline && (
                        <p className="text-muted-foreground">{savedCandidate.candidate.headline}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        {savedCandidate.candidate.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {savedCandidate.candidate.location}
                          </span>
                        )}
                        {savedCandidate.candidate.years_of_experience && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {savedCandidate.candidate.years_of_experience} years exp
                          </span>
                        )}
                        {savedCandidate.saved_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Saved {formatDistanceToNow(new Date(savedCandidate.saved_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      {savedCandidate.candidate.skills && savedCandidate.candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {savedCandidate.candidate.skills.slice(0, 6).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {savedCandidate.candidate.skills.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{savedCandidate.candidate.skills.length - 6} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/candidates/${savedCandidate.candidate_id}`}>
                        View Profile
                      </Link>
                    </Button>
                    {savedCandidate.candidate.email && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${savedCandidate.candidate.email}`}>
                          <Mail className="mr-1 h-4 w-4" />
                          Contact
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setRemovingCandidate({ id: savedCandidate.id, name: `${savedCandidate.candidate.first_name} ${savedCandidate.candidate.last_name}` })}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(total / 20)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Remove Confirmation */}
      <AlertDialog open={!!removingCandidate} onOpenChange={() => setRemovingCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Saved?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removingCandidate?.name} from your saved candidates?
              You can always save them again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

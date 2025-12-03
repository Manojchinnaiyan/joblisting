'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  BookmarkPlus,
  BookmarkCheck,
  Mail,
  ExternalLink,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  useSearchCandidates,
  useSaveCandidate,
  useUnsaveCandidate,
} from '@/hooks/employer/use-candidates'
import { useDebounce } from '@/hooks/use-debounce'

const experienceLevels = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior (6-10 years)' },
  { value: 'lead', label: 'Lead/Principal (10+ years)' },
]

const jobTypes = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
]

export default function CandidatesPage() {
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<string>('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 300000])
  const [page, setPage] = useState(1)

  // Debounce search and location inputs to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300)
  const debouncedLocation = useDebounce(location, 300)

  const { data, isLoading } = useSearchCandidates({
    keywords: debouncedSearch || undefined,
    location: debouncedLocation || undefined,
    years_experience_min: experienceLevel ? parseInt(experienceLevel) : undefined,
    skills: skills.length > 0 ? skills : undefined,
    availability: remoteOnly ? 'immediate' : undefined,
    page,
    limit: 20,
  })

  const saveCandidate = useSaveCandidate()
  const unsaveCandidate = useUnsaveCandidate()

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()])
      }
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const handleSaveToggle = async (candidateId: string, isSaved: boolean) => {
    if (isSaved) {
      await unsaveCandidate.mutateAsync(candidateId)
    } else {
      await saveCandidate.mutateAsync({ candidate_id: candidateId })
    }
  }

  const clearFilters = () => {
    setSearch('')
    setLocation('')
    setExperienceLevel('')
    setSkills([])
    setRemoteOnly(false)
    setSalaryRange([0, 300000])
  }

  const hasActiveFilters = location || experienceLevel || skills.length > 0 || remoteOnly || salaryRange[0] > 0 || salaryRange[1] < 300000

  const candidates = data?.candidates || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Search Candidates</h1>
          <p className="text-muted-foreground">
            Find the perfect candidates for your open positions
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/candidates/saved">
            <BookmarkCheck className="mr-2 h-4 w-4" />
            Saved Candidates
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, title, or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative flex-1 md:max-w-xs">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-10"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Candidates</SheetTitle>
              <SheetDescription>
                Refine your search with additional filters
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Experience Level */}
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any experience</SelectItem>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label>Skills</Label>
                <Input
                  placeholder="Add skill and press Enter..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                />
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveSkill(skill)}
                      >
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Remote Only */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remote"
                  checked={remoteOnly}
                  onCheckedChange={(checked) => setRemoteOnly(checked as boolean)}
                />
                <Label htmlFor="remote">Open to remote work only</Label>
              </div>

              {/* Salary Range */}
              <div className="space-y-4">
                <Label>Expected Salary Range</Label>
                <Slider
                  value={salaryRange}
                  onValueChange={(value) => setSalaryRange(value as [number, number])}
                  min={0}
                  max={300000}
                  step={10000}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>${salaryRange[0].toLocaleString()}</span>
                  <span>${salaryRange[1].toLocaleString()}+</span>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {experienceLevel && (
            <Badge variant="secondary">
              {experienceLevels.find((l) => l.value === experienceLevel)?.label}
              <button onClick={() => setExperienceLevel('')} className="ml-1">×</button>
            </Badge>
          )}
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
              <button onClick={() => handleRemoveSkill(skill)} className="ml-1">×</button>
            </Badge>
          ))}
          {remoteOnly && (
            <Badge variant="secondary">
              Remote Only
              <button onClick={() => setRemoteOnly(false)} className="ml-1">×</button>
            </Badge>
          )}
          {(salaryRange[0] > 0 || salaryRange[1] < 300000) && (
            <Badge variant="secondary">
              ${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
              <button onClick={() => setSalaryRange([0, 300000])} className="ml-1">×</button>
            </Badge>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No candidates found</h3>
            <p className="mt-2 text-muted-foreground text-center">
              Try adjusting your search criteria or filters
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {total} candidate{total !== 1 ? 's' : ''} found
          </p>
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <Card key={candidate.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    {/* Avatar and Basic Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={candidate.avatar_url} />
                        <AvatarFallback className="text-xl">
                          {candidate.first_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/candidates/${candidate.id}`}
                          className="text-lg font-semibold hover:underline"
                        >
                          {candidate.first_name} {candidate.last_name}
                        </Link>
                        {candidate.headline && (
                          <p className="text-muted-foreground">{candidate.headline}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {candidate.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {candidate.location}
                            </span>
                          )}
                          {candidate.years_of_experience && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {candidate.years_of_experience} years exp
                            </span>
                          )}
                          {candidate.is_open_to_work && (
                            <Badge variant="secondary">Open to Work</Badge>
                          )}
                        </div>

                        {/* Skills */}
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {candidate.skills.slice(0, 6).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.skills.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.skills.length - 6} more
                              </Badge>
                            )}
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:flex-col md:items-end">
                      <Button
                        variant={candidate.is_saved ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSaveToggle(candidate.id, candidate.is_saved ?? false)}
                      >
                        {candidate.is_saved ? (
                          <>
                            <BookmarkCheck className="mr-1 h-4 w-4" />
                            Saved
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="mr-1 h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/candidates/${candidate.id}`}>
                          View Profile
                        </Link>
                      </Button>
                      {candidate.email && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`mailto:${candidate.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
        </>
      )}
    </div>
  )
}

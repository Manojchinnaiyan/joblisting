'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  Eye,
  User,
  BadgeCheck,
  X,
  Search,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/admin/data-table'
import {
  useAdminTopSkills,
  useAdminSearchSkills,
  useAdminUsersBySkills,
} from '@/hooks/admin'
import { UserWithSkills } from '@/lib/api/admin/skills'

const skillLevelColors: Record<string, string> = {
  BEGINNER: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  INTERMEDIATE: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  ADVANCED: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  EXPERT: 'bg-green-100 text-green-800 hover:bg-green-100',
}

const skillLevelLabels: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
}

export default function SkillsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillSearchQuery, setSkillSearchQuery] = useState('')

  // Fetch top skills for display
  const { data: topSkills, isLoading: topSkillsLoading } = useAdminTopSkills(20)

  // Fetch skill suggestions for autocomplete
  const { data: skillSuggestions } = useAdminSearchSkills(skillSearchQuery, 10)

  // Build filters
  const filters = useMemo(() => ({
    search: search || undefined,
    role: roleFilter || undefined,
    skills: selectedSkills.length > 0 ? selectedSkills.join(',') : undefined,
  }), [search, roleFilter, selectedSkills])

  // Fetch users by skills
  const { data, isLoading, refetch, isFetching } = useAdminUsersBySkills(filters, { page, limit })

  const addSkill = (skill: string) => {
    const normalizedSkill = skill.toLowerCase().trim()
    if (normalizedSkill && !selectedSkills.includes(normalizedSkill)) {
      setSelectedSkills([...selectedSkills, normalizedSkill])
      setPage(1)
    }
    setSkillSearchQuery('')
  }

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    setPage(1)
  }

  const columns: ColumnDef<UserWithSkills>[] = [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                {user.first_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/admin/users/${user.id}`}
                className="font-medium hover:underline"
              >
                {user.first_name} {user.last_name}
              </Link>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role
        const roleStyles: Record<string, string> = {
          ADMIN: 'bg-purple-100 text-purple-800',
          EMPLOYER: 'bg-blue-100 text-blue-800',
          JOB_SEEKER: 'bg-cyan-100 text-cyan-800',
        }
        const roleLabels: Record<string, string> = {
          JOB_SEEKER: 'Job Seeker',
          EMPLOYER: 'Employer',
          ADMIN: 'Admin',
        }
        return (
          <Badge variant="outline" className={roleStyles[role] || ''}>
            {roleLabels[role] || role}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'profile',
      header: 'Title / Location',
      cell: ({ row }) => {
        const profile = row.original.profile
        if (!profile) return '-'
        return (
          <div>
            {profile.current_title && (
              <p className="font-medium">{profile.current_title}</p>
            )}
            {(profile.city || profile.country) && (
              <p className="text-sm text-muted-foreground">
                {[profile.city, profile.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'skills',
      header: 'Skills',
      cell: ({ row }) => {
        const skills = row.original.skills || []
        const displaySkills = skills.slice(0, 5)
        const remainingCount = skills.length - 5
        return (
          <div className="flex flex-wrap gap-1 max-w-[300px]">
            {displaySkills.map((skill) => (
              <Badge
                key={skill.id}
                variant="outline"
                className={`text-xs ${skillLevelColors[skill.level] || ''}`}
                title={`${skill.name} - ${skillLevelLabels[skill.level]}`}
              >
                {skill.name}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{remainingCount} more
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-2">
            <Badge
              variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}
              className={
                user.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : ''
              }
            >
              {user.status === 'ACTIVE' ? 'Active' : user.status}
            </Badge>
            {user.profile?.open_to_opportunities && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <BadgeCheck className="mr-1 h-3 w-3" />
                Open
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => {
        const date = row.original.created_at
        if (!date) return '-'
        try {
          return format(new Date(date), 'MMM d, yyyy')
        } catch {
          return '-'
        }
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original
        return (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/users/${user.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
        )
      },
    },
  ]

  const users = data?.users || []
  const pagination = data
    ? { page, limit, total: data.total, totalPages: data.total_pages }
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Search Users by Skills
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Find users based on their skills and expertise
          </p>
        </div>
      </div>

      {/* Top Skills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Popular Skills (click to filter)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topSkillsLoading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              topSkills?.map((skill) => (
                <Badge
                  key={skill.name}
                  variant={selectedSkills.includes(skill.name.toLowerCase()) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const normalized = skill.name.toLowerCase()
                    if (selectedSkills.includes(normalized)) {
                      removeSkill(normalized)
                    } else {
                      addSkill(skill.name)
                    }
                  }}
                >
                  {skill.name} ({skill.count})
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Skill Search */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Add skill filter</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type to search skills..."
              value={skillSearchQuery}
              onChange={(e) => setSkillSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && skillSearchQuery) {
                  addSkill(skillSearchQuery)
                }
              }}
              className="pl-9"
            />
            {skillSuggestions && skillSuggestions.length > 0 && skillSearchQuery.length >= 2 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-[200px] overflow-auto">
                {skillSuggestions.map((skill) => (
                  <button
                    key={skill}
                    className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                    onClick={() => addSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Role Filter */}
        <div className="w-full md:w-[180px] space-y-2">
          <label className="text-sm font-medium">Role</label>
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value === 'all' ? '' : value)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="JOB_SEEKER">Job Seeker</SelectItem>
              <SelectItem value="EMPLOYER">Employer</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Skills */}
      {selectedSkills.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Filtering by skills:</span>
          {selectedSkills.map((skill) => (
            <Badge key={skill} variant="default" className="gap-1">
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="ml-1 hover:bg-primary-foreground/20 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSkills([])
              setPage(1)
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search by name or email..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={() => refetch()}
        isRefreshing={isFetching && !isLoading}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, MapPin, Users, Briefcase, ExternalLink, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useFollowingCompanies, useUnfollowCompany } from '@/hooks/use-following'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { format } from 'date-fns'

export default function FollowingPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useFollowingCompanies({ page, per_page: 20 })
  const unfollowCompany = useUnfollowCompany()
  const [unfollowId, setUnfollowId] = useState<string | null>(null)

  const following = data?.companies || []
  const pagination = data?.pagination

  const handleUnfollow = async (companyId: string) => {
    await unfollowCompany.mutateAsync(companyId)
    setUnfollowId(null)
  }

  if (isLoading && page === 1) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Following</h1>
        <p className="text-muted-foreground mt-1">
          Companies you&apos;re following
        </p>
      </div>

      {/* Following List */}
      {following.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Not following any companies</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Follow companies to stay updated on their job openings
            </p>
            <Button asChild>
              <Link href="/companies">Browse Companies</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {following.map((company) => {
            return (
              <Card key={company.id} className="hover:bg-accent transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {company.logo_url && (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <Link href={`/companies/${company.id}`} className="group">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary">
                          {company.name}
                        </h3>
                      </Link>

                      {company.industry && (
                        <p className="text-sm text-muted-foreground">{company.industry}</p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                        {company.industry && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {company.industry}
                          </div>
                        )}
                        {company.company_size && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {company.company_size}
                          </div>
                        )}
                        {company.active_jobs !== undefined && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {company.active_jobs} open positions
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button asChild className="flex-1">
                      <Link href={`/companies/${company.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Profile
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setUnfollowId(company.id)}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Unfollow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={!pagination.has_prev}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.has_next}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Unfollow Confirmation */}
      <ConfirmDialog
        open={!!unfollowId}
        onOpenChange={(open) => !open && setUnfollowId(null)}
        title="Unfollow Company"
        description="Are you sure you want to unfollow this company? You won't receive updates about their job openings."
        confirmText="Unfollow"
        onConfirm={() => unfollowId && handleUnfollow(unfollowId)}
        loading={unfollowCompany.isPending}
      />
    </div>
  )
}
